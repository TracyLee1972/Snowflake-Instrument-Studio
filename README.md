# Snowflake Instrument Studio

Snowflake Instrument Studio is a visual sampler instrument designer.
It lets you import WAV files, map them across an 88-key playable piano, shape sound with ADSR/filter/EQ controls, and save/share instrument presets.
A native VST3 + Standalone plugin for Windows and macOS is also included, compatible with Ableton Live 12 and all VST3-capable DAWs.

## License

This project is released under the **MIT License** — you may use it commercially in your own productions, and distribute it.
See [LICENSE](LICENSE) for the full terms.

## Features

- 88-key playable piano (mouse, touch, and computer keyboard shortcuts)
- WAV sample import (drag-and-drop or batch file picker)
- Key-range mapping view for sample assignments
- 3D blue/white snowflake background in the player interface
- Sound design controls:
	- ADSR envelope
	- Filter cutoff, resonance, and filter type
	- 3-band EQ
	- Pitch, velocity sensitivity, volume
	- Round-robin sample cycling
- Recorder:
	- Record note events
	- Playback rendered output
	- Export recorded audio (WAV)
- DAW Export:
	- Export one `.zip` file containing mapped `.wav` files
	- Includes a mapping text file with key-range/root-note info inside the zip
- Preset management:
	- Save/load `.sis` preset files
	- Share presets via URL hash payload
- Instrument artwork image support
- Native VST3 + Standalone plugin (Windows 11 & macOS)

## Project Structure

- [index.html](index.html) — application shell and layout
- [css/style.css](css/style.css) — dark theme UI styles
- [js/main.js](js/main.js) — app bootstrap and module wiring
- [js/audioEngine.js](js/audioEngine.js) — Web Audio playback engine
- [js/keyboard.js](js/keyboard.js) — 88-key keyboard rendering/input
- [js/sampleManager.js](js/sampleManager.js) — sample import and mapping state
- [js/controls.js](js/controls.js) — knobs/sliders interaction logic
- [js/recorder.js](js/recorder.js) — recording/playback/export logic
- [js/presetManager.js](js/presetManager.js) — `.sis` save/load/share

## Run Locally

This project is static (no build step required).

From the repository root:

```bash
python3 -m http.server 4173
```

Then open:

`http://127.0.0.1:4173/`

## How to Use

1. Import one or more `.wav` files using the Samples panel.
2. Play notes on the on-screen keyboard.
3. Adjust envelope/filter/EQ/pitch/velocity controls.
4. Record a phrase with the recorder footer controls.
5. Save your instrument as a `.sis` preset.
6. Re-open presets with **Open**, or use **Share** to copy a URL payload.

## Use in Your DAW (ZIP Export)

1. Build your instrument mapping in Snowflake Instrument Studio.
2. Click **Export ZIP** in the top bar.
3. Look in your browser Downloads folder for `<instrument>.zip`.
4. Unzip it.
5. Inside you will find:
	- one `.wav` file per mapped sample
	- `<instrument>-mapping.txt`
6. In your DAW, import those WAV files into your sampler of choice.
7. Use the mapping text file to set root notes and key ranges quickly.

## Security Notes

- Uses a strict Content Security Policy in [index.html](index.html).
- No external CDN dependencies.
- No `eval` / dynamic code execution.
- Designed to run entirely on local static assets.

## Browser Support

Modern Chromium, Firefox, and Safari versions with Web Audio API support.
Some recording/export behavior may vary by browser due to MediaRecorder codec support.

## Native VST3 for Windows + macOS

This repository includes a JUCE native plugin project in `native-vst3` and a GitHub Actions workflow that builds VST3 + Standalone binaries for both Windows and macOS.

### Safe Release Runbook (Copy Exactly)

Use this section if you want one simple, low-risk release flow.

1. Commit and push your current branch.
2. Run exactly one of the commands below:

Linux/macOS (bash):

```bash
bash scripts/release-tag.sh 1.0.0
```

Windows (PowerShell):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release-tag.ps1 1.0.0
```

Alternative shortcut (Linux/macOS with Make):

```bash
make release VERSION=1.0.0
```

3. Open GitHub **Actions** and wait for **Release Native VST3** to finish.
4. Open GitHub **Releases** and confirm release `v1.0.0` exists.
5. Confirm these 4 files are attached:
	- `SnowflakeInstrumentStudio-v1.0.0-Windows-VST3.zip`
	- `SnowflakeInstrumentStudio-v1.0.0-Windows-Standalone.zip`
	- `SnowflakeInstrumentStudio-v1.0.0-macOS-VST3.zip`
	- `SnowflakeInstrumentStudio-v1.0.0-macOS-Standalone.zip`

If any step fails, use the workflow logs for that same tag and retry after fixing the reported error.

### Build for both platforms (no local setup needed)

1. Push your latest changes to GitHub.
2. Open **Actions** in your repository.
3. Run workflow: **Native VST3 Cross-Platform Build**.
4. When it finishes, download artifacts:
	- `SnowflakeInstrumentStudio-Windows`
	- `SnowflakeInstrumentStudio-macOS`

### Install paths

- Windows VST3: `C:\Program Files\Common Files\VST3\`
- macOS VST3: `~/Library/Audio/Plug-Ins/VST3/` (or `/Library/Audio/Plug-Ins/VST3/` for all users)

Standalone builds are included in the same artifacts.

### Automatic GitHub Releases (Windows + macOS)

This repository also includes [release-native-vst3.yml](.github/workflows/release-native-vst3.yml).

Release tags must use this format:

- `vMAJOR.MINOR.PATCH` (example: `v1.0.0`)
- Optional suffix is allowed (example: `v1.0.0-rc1`)

When you push a git tag like `v1.0.0`, GitHub Actions will:

1. Build native binaries on Windows and macOS.
2. Package VST3 and Standalone outputs into zip files.
3. Create a GitHub Release and attach those zip files.

You can also run this workflow manually from **Actions** without pushing a tag:

1. Open workflow **Release Native VST3**.
2. Click **Run workflow**.
3. Set `tag_name` (for example `v1.0.0-rc1`).
4. Leave `publish_release` unchecked for dry-run packaging only.
5. Enable `publish_release` if you want it to also create a GitHub Release.

For the exact command set, use **Safe Release Runbook (Copy Exactly)** above.

### Post-release verification checklist

After Actions finishes for the tag, verify:

1. A GitHub Release exists with the same tag name.
2. The Release has four zip assets attached:
	- `SnowflakeInstrumentStudio-<tag>-Windows-VST3.zip`
	- `SnowflakeInstrumentStudio-<tag>-Windows-Standalone.zip`
	- `SnowflakeInstrumentStudio-<tag>-macOS-VST3.zip`
	- `SnowflakeInstrumentStudio-<tag>-macOS-Standalone.zip`
3. You can unzip each package without errors.
4. Plugin scan succeeds in at least one Windows DAW and one macOS DAW.
5. Standalone app launches on Windows and macOS.

If any check fails, open the workflow run logs for the same tag and re-run failed jobs after fixing paths/build settings.
