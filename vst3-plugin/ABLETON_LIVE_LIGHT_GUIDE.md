# Ableton Live Light 12 - Installation Guide for Snowflake Instrument Studio

> 🎵 **Complete guide to installing and using the Snowflake Instrument Studio VST3 plugin in Ableton Live Light 12**

## System Requirements

- **Ableton Live 12** (Light, Standard, or Suite)
- **Windows 11** (x64) or **macOS 11+** (Intel/Apple Silicon)
- **2GB RAM minimum** for basic use, 4GB+ recommended
- **200MB disk space** for plugin and samples

## Installation Steps for Windows 11

### Step 1: Install the VST3 Plugin

1. **Extract the ZIP file** to a folder on your computer
2. **Locate the plugin file:**
   - Navigate to: `SnowflakeInstrumentStudio/VST3/`
   - Look for: `SnowflakeInstrumentStudio.vst3`

3. **Copy to Ableton VST plugins folder:**
   - Default location: `C:\Program Files (x86)\Ableton\Live 12\Resources\Plugins`
   - **OR** system VST folder: `C:\Program Files\Common Files\VST3`

4. **Restart Ableton Live 12**

### Step 2: Rescan/Load in Ableton

1. Open **Ableton Live Light 12**
2. Go to: **Preferences** → **Plug-ins** → **Rescan**
3. Wait for scan to complete
4. The plugin should now appear in your browser under:
   - **Category:** Audio Effects → Instruments
   - **Name:** Snowflake Instrument Studio

### Step 3: Create Your First MIDI Track

1. Create a new **MIDI Track** in your session
2. In the instrument rack on the right, search for **"Snowflake"**
3. Click to add it as your instrument
4. The plugin UI should appear

## Installation Steps for macOS 11+

### Step 1: Install the VST3 Plugin

1. **Extract the ZIP file** to your Downloads folder
2. **Locate the plugin:**
   - Navigate to: `SnowflakeInstrumentStudio/VST3/`
   - Look for: `SnowflakeInstrumentStudio.vst3`

3. **Copy to system VST folder:**
   ```bash
   sudo cp -r SnowflakeInstrumentStudio.vst3 /Library/Audio/Plug-ins/VST3/
   ```

4. **Grant permissions** (if prompted):
   - Right-click → Open
   - Click "Open" in security warning

5. **Restart Ableton Live 12**

### Step 2: Rescan/Load in Ableton

1. Open **Ableton Live 12**
2. Go to: **Preferences** → **Plug-ins** → **Rescan**
3. Wait for scan to complete
4. Plugin appears in browser under Audio Effects → Instruments

## Quick Start Guide

### Loading a Sample

1. **Click: 📂 Browse Samples** button in the plugin UI
2. **Select WAV files** from your computer (works with any sample library)
3. **Click "Open"** to load
4. Display shows: `X samples loaded`

### Auto-Mapping (Recommended)

1. **Click: 🎹 Auto Map** button
2. Samples automatically distributed across MIDI keyboard
3. Root note set automatically based on filename or position

### Manual Mapping (Advanced)

1. Set Root Note, Low Note, High Note combos
2. Click **✓ Apply** to confirm mapping
3. Click **✕ Clear** to reset

### Playing Notes

In Ableton Live, select your MIDI track:

- **MIDI Keyboard**: Press keys on external MIDI keyboard
- **Computer Keyboard**: 
  - White keys: **A** through **L**
  - Black keys: **W** through **P** (shift+white key position)
  - **Z** = octave down
  - **X** = octave up
- **Mouse**: Click on piano keyboard preview at bottom of plugin

### Recording Your Performance

1. **Click: ⏺ Record** button in plugin
2. Play your melody on MIDI keyboard/computer keys/mouse
3. **Click: ⏹ Stop** when done
4. **Click: ▶ Play** to hear playback
5. **Click: 💾 Export** to save as WAV file

### Parameter Control

Adjust in real-time while playing:

| Control | Range | Effect |
|---------|-------|--------|
| **Attack** | 0-5s | How fast note fades in |
| **Decay** | 0-5s | How fast note fades to sustain |
| **Sustain** | 0-100% | Level while note held |
| **Release** | 0-5s | How fast note fades after release |
| **Master Volume** | 0-100% | Overall loudness |
| **Filter Type** | 4 types | Lowpass/Highpass/Bandpass/Notch |
| **Filter Freq** | 20-20kHz | Filter center frequency |
| **Filter Q** | 0.1-20 | Filter resonance/sharpness |
| **Low EQ** | -12 to +12dB | Bass (250Hz) |
| **Mid EQ** | -12 to +12dB | Mids (1kHz) |
| **High EQ** | -12 to +12dB | Treble (4kHz) |
| **Velocity Sensitivity** | 0-100% | How much velocity affects volume |
| **Round Robin** | On/Off | Cycle through sample variations |

## Troubleshooting

### Plugin doesn't appear in Ableton

1. ✅ **Manually rescan:** Preferences → Plug-ins → Rescan
2. ✅ **Check install location:** Ensure file is in VST3 folder
3. ✅ **Restart Ableton completely:** Force quit and reopen
4. ✅ **Check file permissions:** File should be readable by your user
5. ✅ **Windows only:** Ensure both x64 and VST3 (not VST2) installed

### Plugin crashes when loading samples

1. ✅ **Try smaller WAV files** (< 1MB)
2. ✅ **Check sample format:** Must be WAV format (not MP3, FLAC, etc.)
3. ✅ **Reduce sample count:** Load 5-10 samples instead of hundreds
4. ✅ **Restart Ableton:** Force quit and reopen

### No sound when playing notes

1. ✅ **Check volume:** Master Volume slider all the way to right
2. ✅ **Check MIDI routing:** Ableton track pointing to Snowflake plugin
3. ✅ **Load samples first:** Plugin needs samples to produce sound
4. ✅ **Check output:** Ableton Main output not muted

### Samples sound wrong/distorted

1. ✅ **Lower Master Volume:** Reduce to 50-80%
2. ✅ **Lower Velocity Sensitivity:** Reduce to 0.5
3. ✅ **Check filter:** Set filter to bypass position (20kHz)
4. ✅ **Normalize samples:** Use Ableton's audio editing to normalize WAV files

### Export to WAV not working

1. ✅ **Choose save location:** Desktop or Documents folder
2. ✅ **Check disk space:** Need at least 50MB free
3. ✅ **Record first:** Record button must be on before exporting
4. ✅ **Check filename:** Avoid special characters in filename

## Creating a Music Project

### Beginner Workflow

1. Create new Ableton Live session
2. Add MIDI track
3. Load Snowflake Instrument Studio as instrument
4. Load 5-10 drum samples (kick, snare, hihat)
5. Use computer keyboard or mouse to play beats
6. Record MIDI clip
7. Export as WAV for sharing

### Advanced Workflow

1. Multi-track setup:
   - Track 1: Drums (Snowflake + kick samples)
   - Track 2: Bass (Snowflake + bass samples)
   - Track 3: Melody (Snowflake + synth samples)
2. Record MIDI performances on each track
3. Use filter/EQ for sonic variation
4. Add live automation (record parameter changes)
5. Use recording feature to capture perfect take

## License Information

✅ **Commercial Use Allowed** - Create and sell music  
✅ **Royalty-Free** - All music is yours  
✅ **Multiple Installations** - Use on all your computers  
✅ **No Deactivation** - License cannot be disabled  

See `COMMERCIAL_LICENSE.md` in the plugin folder for full terms.

## Support & Resources

- 📖 **Documentation:** See `README.md` and `BUILD.md`
- 🔧 **Troubleshooting:** See individual `.md` files
- 💬 **Questions:** Check GitHub issues/discussions
- 🎓 **Tips:** See `QUICKSTART.md` for quick examples

## Next Steps

1. ✅ Install plugin in Ableton
2. ✅ Rescan and load in MIDI track
3. ✅ Load sample library
4. ✅ Record your first melody
5. ✅ Export as WAV
6. ✅ Share your music!

---

**Happy music making! 🎵**

*Snowflake Instrument Studio v1.0.0 | March 2026*
