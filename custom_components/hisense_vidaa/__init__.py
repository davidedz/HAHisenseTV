"""The Hisense VIDAA TV integration."""
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv, entity_registry as er

from .const import (
    ATTR_APP,
    ATTR_KEY,
    DOMAIN,
    KEY_MAP,
    PLATFORMS,
    SERVICE_LAUNCH_APP,
    SERVICE_SEND_KEY,
)
from .coordinator import VidaaCoordinator

_LOGGER = logging.getLogger(__name__)

_PLATFORMS = [Platform(p) for p in PLATFORMS]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Hisense VIDAA TV from a config entry."""
    coordinator = VidaaCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, _PLATFORMS)

    _async_register_services(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, _PLATFORMS)
    if unload_ok:
        coordinator: VidaaCoordinator = hass.data[DOMAIN].pop(entry.entry_id)
        await coordinator.async_shutdown_tv()
        if not hass.data[DOMAIN]:
            hass.data.pop(DOMAIN)
            _async_unregister_services(hass)
    return unload_ok


def _resolve_coordinators(
    hass: HomeAssistant, entity_ids: list[str] | None
) -> list[VidaaCoordinator]:
    """Map target entity_ids to their coordinators (all if none given)."""
    coordinators: dict[str, VidaaCoordinator] = hass.data.get(DOMAIN, {})
    if not entity_ids:
        return list(coordinators.values())

    registry = er.async_get(hass)
    resolved: list[VidaaCoordinator] = []
    for entity_id in entity_ids:
        rentry = registry.async_get(entity_id)
        if rentry and rentry.config_entry_id in coordinators:
            coord = coordinators[rentry.config_entry_id]
            if coord not in resolved:
                resolved.append(coord)
    return resolved


def _async_register_services(hass: HomeAssistant) -> None:
    """Register integration-wide services (once)."""
    if hass.services.has_service(DOMAIN, SERVICE_SEND_KEY):
        return

    async def _handle_send_key(call: ServiceCall) -> None:
        raw = str(call.data[ATTR_KEY]).strip()
        code = KEY_MAP.get(raw.lower(), raw)
        if not code.upper().startswith("KEY_"):
            code = "KEY_" + code.upper()
        for coord in _resolve_coordinators(hass, call.data.get("entity_id")):
            await coord.tv.async_send_key(code)

    async def _handle_launch_app(call: ServiceCall) -> None:
        app = str(call.data[ATTR_APP]).strip()
        for coord in _resolve_coordinators(hass, call.data.get("entity_id")):
            await coord.tv.async_launch_app(app)

    hass.services.async_register(
        DOMAIN,
        SERVICE_SEND_KEY,
        _handle_send_key,
        schema=vol.Schema(
            {
                vol.Optional("entity_id"): cv.entity_ids,
                vol.Required(ATTR_KEY): cv.string,
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_LAUNCH_APP,
        _handle_launch_app,
        schema=vol.Schema(
            {
                vol.Optional("entity_id"): cv.entity_ids,
                vol.Required(ATTR_APP): cv.string,
            }
        ),
    )


def _async_unregister_services(hass: HomeAssistant) -> None:
    hass.services.async_remove(DOMAIN, SERVICE_SEND_KEY)
    hass.services.async_remove(DOMAIN, SERVICE_LAUNCH_APP)
