# ❄️ Snowflake Instrument Studio

**A free, no-code visual sampler and instrument designer** — open `index.html` in any modern browser on Windows or Mac. No installation required.

---

## Features

| Feature | Details |
|---|---|
| 🎹 **Playable Piano** | 88-key scrollable keyboard — click, drag, or use your computer keyboard |
| 🎵 **WAV Sample Loading** | Drag & drop WAV files onto the sample panel, or browse/batch import |
| 🗺️ **Sample Mapping** | Set Root/Lo/Hi note for each sample; pitch-shifted playback across the keyboard |
| 🔄 **Auto Map** | One-click distributes all samples chromatically across the keyboard |
| 🎚️ **ADSR Envelope** | Attack, Decay, Sustain, Release sliders with live visual display |
| 🎛️ **Filter** | Low Pass / High Pass / Band Pass / Notch with Freq, Q, Gain knobs |
| 📊 **3-Band EQ** | Low (250 Hz), Mid (1 kHz), High (4 kHz) with ±12 dB range |
| 🔊 **Volume & Velocity** | Master volume + velocity sensitivity control |
| 🎡 **Rotary Knobs** | Drag up/down to turn; double-click to reset |
| 🖼️ **Background Image** | Upload any image as the instrument's visual background |
| 🔁 **Round Robin** | Cycles through multiple samples per note to avoid repetition |
| ⏺️ **Melody Recorder** | Record your playing, play it back, export as a WAV file |
| 💾 **Preset Save/Load** | Save your full instrument (samples + settings + image) as a `.sis` file |
| 📤 **Share** | Export portable `.sis` preset files to share with others |
| 🔒 **License Tagging** | Tag each instrument with Personal / Commercial / CC license info |

---

## Getting Started

1. Open `index.html` in Chrome, Edge, Firefox or Safari (no server needed)
2. Drag WAV files into the **Samples** panel on the left
3. Click **Auto Map** to spread them across the keyboard automatically
4. Play notes using your **mouse** or **computer keyboard** (see shortcuts below)
5. Adjust **ADSR, Filter, EQ** in the right panel to shape the sound
6. Hit **⏺ Record**, play your melody, then **💾 Export WAV**
7. Hit **Save** to save your instrument as a `.sis` file

---

## Computer Keyboard Shortcuts

| Key | Function |
|---|---|
| `A S D F G H J K L ; '` | White keys (C D E F G A B C D E F) |
| `W E T Y U O P` | Black keys (C# D# F# G# A#) |
| `Z` / `X` | Octave down / up |
| `Space` (hold) | Sustain pedal |

---

## File Format

`.sis` files are JSON archives containing:
- All sample audio data (base64-encoded WAV)
- Key mapping (root, lo, hi notes per sample)
- All instrument settings (ADSR, filter, EQ, pitch, etc.)
- Optional background image

---

## Commercial Use

When sharing instruments commercially, ensure you hold appropriate licenses for all audio samples included. Use the **License** selector in the export screen to tag your instrument accordingly.

---

## Browser Compatibility

Works in any browser that supports the **Web Audio API** (all modern browsers on Windows and Mac).
For DAW integration: export your melody as a WAV and import it into any DAW (Ableton, Logic, FL Studio, etc.).
