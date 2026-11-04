"""Constants for the Hisense VIDAA TV integration."""
from __future__ import annotations

from typing import Final

DOMAIN: Final = "hisense_vidaa"

CONF_HOST: Final = "host"
CONF_PORT: Final = "port"
CONF_MAC: Final = "mac"
CONF_NAME: Final = "name"
CONF_PIN: Final = "pin"

DEFAULT_PORT: Final = 36669
DEFAULT_NAME: Final = "Hisense VIDAA TV"

# File (inside the HA config dir) where vidaa-control persists auth tokens.
TOKEN_FILE: Final = "hisense_vidaa_tokens.json"

# How often the coordinator polls the TV for state/volume.
UPDATE_INTERVAL_SECONDS: Final = 20

PLATFORMS: Final = ["media_player", "remote"]

# ---------------------------------------------------------------------------
# Remote keys
# ---------------------------------------------------------------------------
# Friendly name -> raw VIDAA key code accepted by remote_service/sendkey.
# The friendly names are what the `remote.send_command` service and the
# `hisense_vidaa.send_key` service accept (case-insensitive). Raw KEY_* codes
# are also accepted directly.
KEY_MAP: Final[dict[str, str]] = {
    "power": "KEY_POWER",
    "home": "KEY_HOME",
    "menu": "KEY_MENU",
    "back": "KEY_BACK",
    "exit": "KEY_EXIT",
    "returns": "KEY_RETURNS",
    "info": "KEY_INFO",
    "subtitle": "KEY_SUBTITLE",
    "up": "KEY_UP",
    "down": "KEY_DOWN",
    "left": "KEY_LEFT",
    "right": "KEY_RIGHT",
    "ok": "KEY_OK",
    "ok_long": "KEY_OK_LONG_PRESS",
    "volume_up": "KEY_VOLUMEUP",
    "volume_down": "KEY_VOLUMEDOWN",
    "mute": "KEY_MUTE",
    "mute_long": "KEY_MUTE_LONG_PRESS",
    "channel_up": "KEY_CHANNELUP",
    "channel_down": "KEY_CHANNELDOWN",
    "channel_dot": "KEY_CHANNELDOT",
    "play": "KEY_PLAY",
    "pause": "KEY_PAUSE",
    "stop": "KEY_STOP",
    "fast_forward": "KEY_FORWARDS",
    "forward": "KEY_FORWARDS",
    "red": "KEY_RED",
    "green": "KEY_GREEN",
    "yellow": "KEY_YELLOW",
    "blue": "KEY_BLUE",
    "zoom_in": "KEY_ZOOMIN",
    "zoom_out": "KEY_ZOOMOUT",
    "voice_up": "KEY_VOICEUP",
    "voice_down": "KEY_VOICEDOWN",
    "mouse": "KEY_LEFTMOUSEKEYS",
    "num_0": "KEY_0",
    "num_1": "KEY_1",
    "num_2": "KEY_2",
    "num_3": "KEY_3",
    "num_4": "KEY_4",
    "num_5": "KEY_5",
    "num_6": "KEY_6",
    "num_7": "KEY_7",
    "num_8": "KEY_8",
    "num_9": "KEY_9",
}

# Human-readable labels for the hardware input sources exposed by the TV.
SOURCE_LABELS: Final[dict[str, str]] = {
    "tv": "TV",
    "av": "AV",
    "component": "Component",
    "hdmi1": "HDMI 1",
    "hdmi2": "HDMI 2",
    "hdmi3": "HDMI 3",
    "hdmi4": "HDMI 4",
}

# Service names
SERVICE_SEND_KEY: Final = "send_key"
SERVICE_LAUNCH_APP: Final = "launch_app"
ATTR_KEY: Final = "key"
ATTR_APP: Final = "app"
