"""Config flow for the Hisense VIDAA TV integration."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers import config_validation as cv

from vidaa import AsyncVidaaTV, TokenStorage

from .const import (
    CONF_HOST,
    CONF_MAC,
    CONF_NAME,
    CONF_PIN,
    CONF_PORT,
    DEFAULT_NAME,
    DEFAULT_PORT,
    DOMAIN,
    TOKEN_FILE,
)

_LOGGER = logging.getLogger(__name__)


def _normalize_mac(mac: str | None) -> str | None:
    if not mac:
        return None
    cleaned = mac.strip().lower().replace("-", ":")
    return cleaned or None


class VidaaConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the Hisense VIDAA TV config flow."""

    VERSION = 1

    def __init__(self) -> None:
        self._host: str | None = None
        self._port: int = DEFAULT_PORT
        self._mac: str | None = None
        self._name: str = DEFAULT_NAME
        self._tv: AsyncVidaaTV | None = None

    # -- user step ------------------------------------------------------
    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}

        if user_input is not None:
            self._host = user_input[CONF_HOST].strip()
            self._port = user_input.get(CONF_PORT, DEFAULT_PORT)
            self._mac = _normalize_mac(user_input.get(CONF_MAC))
            self._name = user_input.get(CONF_NAME, DEFAULT_NAME).strip() or DEFAULT_NAME

            await self.async_set_unique_id(self._mac or self._host)
            self._abort_if_unique_id_configured()

            try:
                self._tv = self._build_client()
                connected = await self._tv.async_connect(timeout=15)
                if not connected:
                    errors["base"] = "cannot_connect"
                elif self._tv.is_authenticated:
                    return await self._create_entry()
                else:
                    await self._tv.async_start_pairing()
                    return await self.async_step_pair()
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Unexpected error connecting to VIDAA TV")
                errors["base"] = "cannot_connect"

        schema = vol.Schema(
            {
                vol.Required(CONF_HOST, default=self._host or ""): cv.string,
                vol.Optional(CONF_MAC, default=self._mac or ""): cv.string,
                vol.Optional(CONF_PORT, default=self._port): cv.port,
                vol.Optional(CONF_NAME, default=self._name): cv.string,
            }
        )
        return self.async_show_form(
            step_id="user", data_schema=schema, errors=errors
        )

    # -- pairing step ---------------------------------------------------
    async def async_step_pair(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}

        if user_input is not None and self._tv is not None:
            pin = str(user_input[CONF_PIN]).strip()
            try:
                ok = await self._tv.async_authenticate(pin, timeout=12)
                if ok or self._tv.is_authenticated:
                    return await self._create_entry()
                errors["base"] = "invalid_auth"
                # Issue a fresh PIN for the next attempt.
                await self._tv.async_start_pairing()
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Unexpected error during pairing")
                errors["base"] = "invalid_auth"

        schema = vol.Schema({vol.Required(CONF_PIN): cv.string})
        return self.async_show_form(
            step_id="pair", data_schema=schema, errors=errors
        )

    # -- reauth ---------------------------------------------------------
    async def async_step_reauth(
        self, entry_data: dict[str, Any]
    ) -> ConfigFlowResult:
        self._host = entry_data[CONF_HOST]
        self._port = entry_data.get(CONF_PORT, DEFAULT_PORT)
        self._mac = entry_data.get(CONF_MAC)
        self._name = entry_data.get(CONF_NAME, DEFAULT_NAME)
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None and self._tv is not None:
            pin = str(user_input[CONF_PIN]).strip()
            ok = await self._tv.async_authenticate(pin, timeout=12)
            if ok or self._tv.is_authenticated:
                entry = self.hass.config_entries.async_get_entry(
                    self.context["entry_id"]
                )
                if entry is not None:
                    await self.hass.config_entries.async_reload(entry.entry_id)
                return self.async_abort(reason="reauth_successful")
            errors["base"] = "invalid_auth"
            await self._tv.async_start_pairing()

        if self._tv is None:
            self._tv = self._build_client()
            await self._tv.async_connect(timeout=15)
            if self._tv.is_authenticated:
                return self.async_abort(reason="reauth_successful")
            await self._tv.async_start_pairing()

        schema = vol.Schema({vol.Required(CONF_PIN): cv.string})
        return self.async_show_form(
            step_id="reauth_confirm", data_schema=schema, errors=errors
        )

    # -- helpers --------------------------------------------------------
    def _build_client(self) -> AsyncVidaaTV:
        storage = TokenStorage(Path(self.hass.config.path(TOKEN_FILE)))
        return AsyncVidaaTV(
            host=self._host,
            port=self._port,
            mac_address=self._mac,
            use_dynamic_auth=True,
            auto_detect_protocol=True,
            enable_persistence=True,
            storage=storage,
        )

    async def _create_entry(self) -> ConfigFlowResult:
        if self._tv is not None:
            await self._tv.async_disconnect()
        return self.async_create_entry(
            title=self._name,
            data={
                CONF_HOST: self._host,
                CONF_PORT: self._port,
                CONF_MAC: self._mac,
                CONF_NAME: self._name,
            },
        )
