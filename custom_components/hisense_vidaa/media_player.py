"""Media player platform for the Hisense VIDAA TV integration."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from homeassistant.components.media_player import (
    MediaPlayerDeviceClass,
    MediaPlayerEntity,
    MediaPlayerEntityFeature,
    MediaPlayerState,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from vidaa.wol import send_wol

from .const import DOMAIN, SOURCE_LABELS
from .coordinator import VidaaCoordinator
from .entity import VidaaEntity

_LOGGER = logging.getLogger(__name__)

SUPPORT_VIDAA = (
    MediaPlayerEntityFeature.TURN_ON
    | MediaPlayerEntityFeature.TURN_OFF
    | MediaPlayerEntityFeature.VOLUME_SET
    | MediaPlayerEntityFeature.VOLUME_MUTE
    | MediaPlayerEntityFeature.VOLUME_STEP
    | MediaPlayerEntityFeature.SELECT_SOURCE
    | MediaPlayerEntityFeature.PLAY
    | MediaPlayerEntityFeature.PAUSE
    | MediaPlayerEntityFeature.STOP
    | MediaPlayerEntityFeature.NEXT_TRACK
    | MediaPlayerEntityFeature.PREVIOUS_TRACK
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the media player from a config entry."""
    coordinator: VidaaCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([VidaaMediaPlayer(coordinator)])


class VidaaMediaPlayer(VidaaEntity, MediaPlayerEntity):
    """Representation of a Hisense VIDAA TV as a media player."""

    _attr_name = None
    _attr_supported_features = SUPPORT_VIDAA
    _attr_device_class = MediaPlayerDeviceClass.TV

    def __init__(self, coordinator: VidaaCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_mediaplayer"
        # Maps the user-facing source label -> callable kind.
        # hw sources use set_source; app sources use launch_app.
        self._hw_sources: dict[str, str] = {
            label: key for key, label in SOURCE_LABELS.items()
        }
        self._app_sources: dict[str, str] = {}

    async def async_added_to_hass(self) -> None:
        """Query the TV once for its real input and app lists."""
        await super().async_added_to_hass()
        await self._async_refresh_source_list()

    async def _async_refresh_source_list(self) -> None:
        tv = self.coordinator.tv
        try:
            sources = await tv.async_get_sources(timeout=5)
            if sources:
                hw: dict[str, str] = {}
                for item in sources:
                    if not isinstance(item, dict):
                        continue
                    name = (
                        item.get("sourcename")
                        or item.get("displayname")
                        or item.get("sourceid")
                    )
                    sid = item.get("sourceid")
                    if name and sid is not None:
                        hw[str(name)] = str(sid)
                if hw:
                    self._hw_sources = hw
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not fetch source list: %s", err)

        try:
            apps = await tv.async_get_apps(timeout=5)
            if apps:
                self._app_sources = {
                    str(a.get("name")): str(a.get("name"))
                    for a in apps
                    if isinstance(a, dict) and a.get("name")
                }
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not fetch app list: %s", err)

        self.async_write_ha_state()

    # -- state ----------------------------------------------------------
    @property
    def state(self) -> MediaPlayerState:
        data = self.coordinator.data or {}
        return MediaPlayerState.ON if data.get("is_on") else MediaPlayerState.OFF

    @property
    def volume_level(self) -> float | None:
        vol = (self.coordinator.data or {}).get("volume")
        return vol / 100 if isinstance(vol, int) else None

    @property
    def is_volume_muted(self) -> bool | None:
        return (self.coordinator.data or {}).get("muted")

    @property
    def source_list(self) -> list[str]:
        return list(self._hw_sources.keys()) + list(self._app_sources.keys())

    @property
    def source(self) -> str | None:
        data = self.coordinator.data or {}
        state = data.get("state") or {}
        return state.get("sourcename") or state.get("displayname")

    # -- commands -------------------------------------------------------
    async def async_turn_on(self) -> None:
        mac = self.coordinator.mac
        if mac:
            await self.hass.async_add_executor_job(send_wol, mac)
        await self.coordinator.tv.async_power_on()
        await self.coordinator.async_request_refresh()

    async def async_turn_off(self) -> None:
        await self.coordinator.tv.async_power_off()
        await self.coordinator.async_request_refresh()

    async def async_set_volume_level(self, volume: float) -> None:
        await self.coordinator.tv.async_set_volume(int(round(volume * 100)))
        await self.coordinator.async_request_refresh()

    async def async_volume_up(self) -> None:
        await self.coordinator.tv.async_volume_up()
        await self.coordinator.async_request_refresh()

    async def async_volume_down(self) -> None:
        await self.coordinator.tv.async_volume_down()
        await self.coordinator.async_request_refresh()

    async def async_mute_volume(self, mute: bool) -> None:
        await self.coordinator.tv.async_mute()
        await self.coordinator.async_request_refresh()

    async def async_select_source(self, source: str) -> None:
        if source in self._hw_sources:
            await self.coordinator.tv.async_set_source(self._hw_sources[source])
            # The "TV" input is already active while a VIDAA app or the home
            # screen is on top of it, so switching to it does nothing visible.
            # Also open the live-TV channels app (e.g. "Canali DTV") if present.
            if source.strip().lower() in ("tv", "dtv", "atv"):
                live = next(
                    (name for name in self._app_sources if "dtv" in name.lower()),
                    None,
                )
                if live:
                    await asyncio.sleep(0.5)
                    await self.coordinator.tv.async_launch_app(self._app_sources[live])
        elif source in self._app_sources:
            await self.coordinator.tv.async_launch_app(self._app_sources[source])
        else:
            _LOGGER.warning("Unknown source: %s", source)
        await self.coordinator.async_request_refresh()

    async def async_media_play(self) -> None:
        await self.coordinator.tv.async_play()

    async def async_media_pause(self) -> None:
        await self.coordinator.tv.async_pause()

    async def async_media_stop(self) -> None:
        await self.coordinator.tv.async_stop()

    async def async_media_next_track(self) -> None:
        await self.coordinator.tv.async_send_key("KEY_CHANNELUP")

    async def async_media_previous_track(self) -> None:
        await self.coordinator.tv.async_send_key("KEY_CHANNELDOWN")
