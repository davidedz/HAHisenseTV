# Hisense VIDAA TV — Home Assistant integration

<img src="icon.png" alt="logo" width="96" align="right" />

Control a **Hisense / VIDAA** smart TV **locally** from Home Assistant, over the
TV's built-in MQTT-over-TLS remote protocol (the same one the official
*RemoteNOW / VIDAA* mobile app uses). No cloud, no polling of external servers.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

## Features

- **Media player** entity: on/off, volume set / step / mute, input source
  selection, play / pause / stop, channel up/down.
- **Remote** entity: `remote.send_command` with any key (friendly names or raw
  `KEY_*` codes).
- **Services**: `hisense_vidaa.send_key`, `hisense_vidaa.launch_app`.
- **Local push**: TV state broadcasts update entities in near real time.
- **Wake-on-LAN** power-on (when the MAC address is provided).
- Guided **PIN pairing** in the UI, with automatic token persistence and
  re-pairing (reauth) when a token expires.

## How it works

Recent VIDAA firmware exposes an MQTT broker on the TV at port **36669** over
TLS. Connecting requires a **client certificate**, **dynamically generated
credentials** (derived from the TV MAC + a timestamp) and a one-time **PIN
pairing**. All of this is implemented by the
[`vidaa-control`](https://github.com/tombabolewski/vidaa-control) library, which
this integration wraps. The protocol was reverse-engineered from the official
app; older firmware that still accepts the legacy fixed credentials is handled
automatically by the library's protocol auto-detection.

## Installation (HACS)

1. HACS → ⋮ → **Custom repositories** → add
   `https://github.com/davidedz/HAHisenseTV` with category **Integration**.
2. Install **Hisense VIDAA TV**, then **restart** Home Assistant.
3. Settings → **Devices & Services** → **Add Integration** → *Hisense VIDAA TV*.

### Manual installation

Copy `custom_components/hisense_vidaa` into your HA `config/custom_components/`
folder and restart.

## Configuration

1. Make sure the **TV is on** and on the same network.
2. Enter the TV **IP address**. Entering the **MAC address** is recommended on
   recent firmware (enables Wake-on-LAN power-on and more reliable credentials).
3. A **4-digit PIN** appears on the TV screen — type it in. If it expires,
   submit again to get a fresh one.

The auth token is stored in `config/hisense_vidaa_tokens.json` so subsequent
restarts reconnect without a PIN.

## Remote card

The integration ships a TV-remote style Lovelace card and registers it
automatically (no manual resource needed — restart HA and hard-refresh the
browser). Everything is configured from the UI:

1. Edit a dashboard → **Add card** → *Hisense VIDAA Remote*.
2. Pick the TV's media player and an optional name. You can hide the **title**
   and the **status line** (e.g. "On · TV") independently.
3. Set the number pad: collapsible (closed/open at start), **popup** (opens
   like the INPUT list) or hidden; optionally show the colour keys.
4. Under **Inputs shown in the INPUT popup** pick only the inputs/apps you want
   (leave empty for the TV's full list), renaming each and choosing an icon.
5. Under **Quick-launch shortcuts** add, reorder or remove buttons. Each one has
   a name, an icon (or short text), and an action: *Launch app*, *Select
   source* or *Send key*. **Restore defaults** brings back Netflix, Prime Video,
   Disney+ and YouTube.

The card has power with on/off status, D-pad + OK (hold to repeat),
back/exit/home, an **INPUT** button that opens the full source list,
volume/mute/channel, menu/info, play/pause/stop, rewind/forward/subtitles and a
collapsible number pad. (YAML is still supported: `type:
custom:hisense-vidaa-remote-card`, `entity`, `name`, `numpad`, `show_colors`,
`sources` with `icon`/`text` plus one of `app`, `source`, `key`.)

## Services

### `hisense_vidaa.send_key`
| field | required | description |
|-------|----------|-------------|
| `entity_id` | no | target entity (defaults to all) |
| `key` | yes | friendly name (`home`, `menu`, `volume_up`, `num_5`, …) or raw `KEY_POWER` |

### `hisense_vidaa.launch_app`
| field | required | description |
|-------|----------|-------------|
| `entity_id` | no | target entity (defaults to all) |
| `app` | yes | `netflix`, `youtube`, `amazon`, `disney`, `tubi`, … or an installed app's exact name |

You can also use the standard `remote.send_command` service against the TV's
remote entity with the same key names.

### Available keys

`power, home, menu, back, exit, returns, info, subtitle, up, down, left, right,
ok, volume_up, volume_down, mute, channel_up, channel_down, channel_dot, play,
pause, stop, rewind, fast_forward, red, green, yellow, blue, zoom_in, zoom_out,
voice_up, voice_down, num_0 … num_9`

## Notes & limitations

- The TV accepts **one remote session at a time** — close the official phone
  app while pairing/using this integration if you hit issues.
- Power-**on** from deep standby needs **Wake-on-LAN** (provide the MAC); the
  MQTT broker is not reachable when the TV is fully off.
- The brand icon shown inside Home Assistant comes from the
  [home-assistant/brands](https://github.com/home-assistant/brands) repo; the
  included `icon.png` is used for GitHub/HACS and as a starting point for a
  brands submission.

## Credits

- Protocol library: [`vidaa-control`](https://github.com/tombabolewski/vidaa-control).
- Protocol research: the Hisense/VIDAA MQTT remote protocol community
  (`mqtt-hisensetv`, `hisensetv`, and others).

## License

MIT — see [LICENSE](LICENSE).
