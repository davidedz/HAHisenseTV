"""Remote platform for the Hisense VIDAA TV integration."""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Iterable
from typing import Any

from homeassistant.components.remote import ATTR_DELAY_SECS, ATTR_NUM_REPEATS, RemoteEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, KEY_MAP
from .coordinator import VidaaCoordinator
from .entity import VidaaEntity

_LOGGER = logging.getLogger(__name__)

DEFAULT_DELAY = 0.4


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the remote from a config entry."""
    coordinator: VidaaCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([VidaaRemote(coordinator)])


class VidaaRemote(VidaaEntity, RemoteEntity):
    """A remote that can send any raw VIDAA key code."""

    _attr_name = "Remote"

    def __init__(self, coordinator: VidaaCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_remote"

    @property
    def is_on(self) -> bool:
        return bool((self.coordinator.data or {}).get("is_on"))

    @staticmethod
    def _resolve(command: str) -> str:
        cmd = command.strip()
        code = KEY_MAP.get(cmd.lower(), cmd)
        if not code.upper().startswith("KEY_"):
            code = "KEY_" + code.upper()
        return code

    async def async_turn_on(self, **kwargs: Any) -> None:
        mac = self.coordinator.mac
        if mac:
            from vidaa.wol import send_wol

            await self.hass.async_add_executor_job(send_wol, mac)
        await self.coordinator.tv.async_power_on()
        await self.coordinator.async_request_refresh()

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.tv.async_power_off()
        await self.coordinator.async_request_refresh()

    async def async_send_command(self, command: Iterable[str], **kwargs: Any) -> None:
        num_repeats = kwargs.get(ATTR_NUM_REPEATS, 1)
        delay = kwargs.get(ATTR_DELAY_SECS, DEFAULT_DELAY)
        commands = list(command)
        for _ in range(num_repeats):
            for raw in commands:
                code = self._resolve(raw)
                await self.coordinator.tv.async_send_key(code)
                if delay:
                    await asyncio.sleep(delay)
