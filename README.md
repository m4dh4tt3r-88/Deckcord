# TacCord
## Tactical Discord Comms for SteamOS

A maintained fork of [Deckcord](https://github.com/marios8543/Deckcord) with bug fixes and cross-device compatibility.

## Features
- Runs web Discord as a separate tab in the background.
- Open/Close easily while in-game from the main menu.
- Mute/Deafen/Disconnect and check members in your channel from the QAM.
- One-button post Steam screenshots to your recent channels.
- Show your current game as playing status.
- Get notifications for DMs and pings in-game.
- Push-to-talk support with physical keybind to rear buttons.
- [Vencord](https://vencord.dev/) injected automatically for extended functionality.
- Working screenshare with audio.

## What's fixed vs upstream
- Corrected `decky-frontend-lib` dependency (`@decky/api`, `@decky/ui`, `@decky/rollup`)
- Fixed `menuPatch` for SteamOS 3.7+ (`onGamepadFocus` prop rename)
- Fixed event listener leak in `useDeckcordState` (anonymous function mismatch)
- Fixed wrong event name in `removeEventListener("state")`
- Fixed `UploadScreenshot` crash on fresh login
- Fixed PTT button ref loss on re-render

## How to install
1. Enable *Developer Mode* in Decky General settings.
2. Go to Developer in Decky settings.
3. Enter the install URL in *Install Plugin from URL* and press install.

## Credits
- Original plugin by [@marios8543](https://github.com/marios8543) — TacCord is a fork of [Deckcord](https://github.com/marios8543/Deckcord).
- Huge thanks to [@aagaming](https://github.com/AAGaming00) for his enormous contributions towards getting mic working on the SteamClient tab, as well as his general support throughout the development of this plugin.
- Huge thanks to [@Epictek](https://github.com/Epictek) for his help in getting QR Code login working.
- Huge thanks to [@jessebofill](https://github.com/jessebofill) for the menu patching code.
