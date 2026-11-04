"""Connection coordinator for the Hisense VIDAA TV integration."""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from vidaa import AsyncVidaaTV, TokenStorage

from .const import (
    CONF_HOST,
    CONF_MAC,
    CONF_PORT,
    DEFAULT_PORT,
    TOKEN_FILE,
    UPDATE_INTERVAL_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


class VidaaCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Owns the AsyncVidaaTV client and keeps TV state fresh."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=f"hisense_vidaa {entry.data[CONF_HOST]}",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
        )
        self.entry = entry
        self._host: str = entry.data[CONF_HOST]
        self._port: int = entry.data.get(CONF_PORT, DEFAULT_PORT)
        self._mac: str | None = entry.data.get(CONF_MAC)

        storage = TokenStorage(hass.config.path(TOKEN_FILE))
        self.tv = AsyncVidaaTV(
            host=self._host,
            port=self._port,
            mac_address=self._mac,
            use_dynamic_auth=True,
            auto_detect_protocol=True,
            enable_persistence=True,
            storage=storage,
            on_state_change=self._on_state_change,
        )

    @property
    def mac(self) -> str | None:
        """Return the TV MAC address if known."""
        return self._mac

    @property
    def host(self) -> str:
        """Return the TV host/IP."""
        return self._host

    # -- push updates from TV broadcasts --------------------------------
    def _on_state_change(self, state: dict) -> None:
        """Handle a broadcast state update (runs in an executor thread)."""
        self.hass.loop.call_soon_threadsafe(self._apply_push, state)

    @callback
    def _apply_push(self, state: dict) -> None:
        data = dict(self.data or {})
        data["state"] = state
        data["is_on"] = self._state_is_on(state)
        data["available"] = True
        data["volume"] = self.tv.cached_volume
        data["muted"] = self.tv.is_muted
        self.async_set_updated_data(data)

    @staticmethod
    def _state_is_on(state: dict | None) -> bool:
        if not state:
            return False
        return state.get("statetype") != "fake_sleep_0"

    # -- lifecycle ------------------------------------------------------
    async def async_ensure_connected(self) -> None:
        """Connect (and authenticate via saved token) if not already."""
        if self.tv.is_connected:
            return
        connected = await self.tv.async_connect(timeout=15)
        if not connected:
            raise UpdateFailed(f"Cannot connect to TV at {self._host}:{self._port}")
        if not self.tv.is_authenticated():
            raise ConfigEntryAuthFailed(
                "TV rejected the saved token; re-pairing required"
            )

    async def async_shutdown_tv(self) -> None:
        """Disconnect from the TV."""
        try:
            await self.tv.async_disconnect()
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Error while disconnecting: %s", err)

    async def _async_update_data(self) -> dict[str, Any]:
        await self.async_ensure_connected()

        try:
            state = await self.tv.async_get_state(timeout=5)
        except Exception as err:  # noqa: BLE001
            raise UpdateFailed(f"State query failed: {err}") from err

        is_on = self._state_is_on(state)

        volume: int | None = self.tv.cached_volume
        muted: bool = self.tv.is_muted
        if is_on:
            try:
                vol = await self.tv.async_get_volume(timeout=4)
                if vol is not None:
                    volume = vol
                muted = self.tv.is_muted
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Volume query failed: %s", err)

        return {
            "available": True,
            "is_on": is_on,
            "state": state or {},
            "volume": volume,
            "muted": muted,
        }
