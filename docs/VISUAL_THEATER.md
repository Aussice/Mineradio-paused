# Mineradio Visual

This fork adds a music-reactive fireworks stage and the complete Kaleidoscope Studio to Mineradio's existing Windows player. Original Mineradio copyrights, GPL-3.0 license, provider adapters and attribution are retained.

## Use

Choose **音乐烟花**, **万花筒** or **原生舞台** in the window titlebar. The native library, account login, playlist queue, search, local audio import, lyrics and transport remain the player controls. Start a track, then choose **视觉控制** to adjust the active stage. Click an unobstructed area of the fireworks sky to launch a burst; Shift-click launches a halo.

The fireworks controls provide sensitivity, particle density, bloom, gravity, wind, palettes, smoke, automatic finales, a manual finale and optional delayed explosion sounds. Low frequency onsets trigger bursts, the middle frequency band creates halos, and high frequencies create meteors. Frequency bands are an approximation, not isolated instrument or vocal stems. The fireworks renderer uses particle gravity and drag, turbulence, fading colors, secondary splitting, retained particle trails, HDR bloom, exposure adaptation and a stylized lake reflection.

Kaleidoscope mode offers all original artwork presets, mirror count, speed and music response. **打开完整万花筒工作室** opens the original editor, including image upload and its existing controls. The editor is currently independent of the playback spectrum; the embedded Kaleidoscope stage receives the spectrum.

**试听音乐** plays an original generated ambient loop and pauses the native player. **开启麦克风** pauses native playback, requests only audio capture and analyses it locally without speaker monitoring or recording. Close the microphone with the same button; switching back to the native stage destroys the frame and releases its stream. Windows microphone privacy settings still apply. No music, raw microphone audio or credentials are sent through the visual bridge.

## Platforms and playlists

All original provider and playlist adapters are retained. Availability still depends on the respective platform, the user's account, network and service changes. This fork does not imply that every provider currently works or that a playlist import grants playback rights. No live account was used to verify account-specific playlists in development.

## Build

From the repository root:

```text
npm ci
npm start
npm run build:win
```

`build:visual` checks TypeScript and builds both stage and complete editor into `public/visual-studio/`. `build:win` builds these assets before creating a Windows x64 NSIS installer in `dist/`. All builds disable automatic publication. `npm run test:visual` checks the microphone permission boundary. Existing upstream regression checks remain under `tests/` and `scripts/quick-check.js`.

The fork has its own application ID, install marker, installation folder, user profile and GitHub update source (`Aussice/Mineradio-paused`). It does not use the original application's release downloads. Installer binaries are unsigned development builds.

## Source and assets

Visual Studio sources live in `visual-studio/`. Its complete React editor, shaders and artwork presets were adapted from the local Kaleidoscope project. Material textures originate from ambientCG; the copied source manifest is at `visual-studio/sucai/MANIFEST.md`. The existing Mineradio application uses its vendored Three.js version; the visual frame has a separately bundled Three.js runtime to avoid changing upstream rendering behavior.

The bridge validates message origin and source, exchanges bounded frequency values at most 34 times per second, and keeps provider credentials in the native application. A microphone grant is limited to the local visual document, current app window and a 30-second request window. Visual preferences are stored on-device. Reduced-motion preferences disable automatic ambient launches and reduce particle density.

## Verification notes

TypeScript compilation, the visual production build, the microphone permission tests and the complete upstream static/regression quick check pass. Browser checks covered fireworks rendering, generated demo playback, stage switching, the full Kaleidoscope editor and return to the player. A Windows x64 installer is built locally.

The upstream Electron rendering smoke test fails its two dual-language lyric-row assertions (`dual/dual` and `dual/multi`). The same failures were reproduced against an unmodified archive of `upstream/main` with the same Electron runtime. This fork does not alter those lyric algorithms. Account-specific playlist imports and live microphone capture were not manually exercised.
