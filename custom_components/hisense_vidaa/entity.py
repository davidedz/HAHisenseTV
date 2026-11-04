"""Base entity for the Hisense VIDAA TV integration."""
from __future__ import annotations

from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import VidaaCoordinator


class VidaaEntity(CoordinatorEntity[VidaaCoordinator]):
    """Common base: shared device info and availability."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: VidaaCoordinator) -> None:
        super().__init__(coordinator)
        entry = coordinator.entry
        identifier = coordinator.mac or coordinator.host
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="Hisense",
            model="VIDAA TV",
            connections=(
                {(CONNECTION_NETWORK_MAC, coordinator.mac)}
                if coordinator.mac
                else set()
            ),
            configuration_url=f"http://{coordinator.host}",
        )
        self._identifier = identifier

    @property
    def available(self) -> bool:
        """Entity is available while the coordinator last update succeeded."""
        return self.coordinator.last_update_success
