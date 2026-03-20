# Snowflake Instrument Studio VST3 & AU & Standalone
## Complete Installation Guide for macOS & Ableton Live 12

**Version:** 1.0.0  
**Platform:** macOS 11.0+ (Apple Silicon & Intel)  
**Compatibility:** Ableton Live 12, Logic Pro, Final Cut Pro, Standalone

---

## 📦 Package Contents

```
SnowflakeInstrumentStudio-1.0.0-macOS/
├── VST3/
│   └── SnowflakeInstrumentStudio.vst3/     (VST3 Plugin)
├── AU/
│   └── SnowflakeInstrumentStudio.component (AU Plugin - optional)
├── Standalone/
│   └── SnowflakeInstrumentStudio.app       (Standalone Application)
├── Documentation/
│   ├── README.md
│   └── INSTALL_macOS.md
└── LICENSE
```

---

## 🎹 Installation - VST3 Plugin for Ableton Live 12

### **Method 1: Automatic (Recommended)**

1. **Extract the ZIP file** anywhere
2. **Open Finder** → **Applications** → **Utilities** → **Terminal**
3. **Paste this command:**
   ```bash
   cp -r ~/Downloads/SnowflakeInstrumentStudio-*/VST3/*.vst3 \
     ~/Library/Audio/Plug-Ins/VST3/
   ```
4. **Press Enter**
5. **Restart Ableton Live 12**
6. Plugin appears in your instruments ✅

### **Method 2: Manual Installation**

1. **Extract** the ZIP file
2. **Open Finder** → **Go** → **Go to Folder** (⌘ Shift G)
3. **Paste path:**
   ```
   ~/Library/Audio/Plug-Ins/VST3/
   ```
   (If folder doesn't exist, create it first)
4. **Drag** `VST3/SnowflakeInstrumentStudio.vst3` here
5. **Restart Ableton Live 12**

### **For Apple Silicon Macs:**
The plugin is **universal binary** (arm64 + x86_64). Works natively on both processors!

---

## 🎜 Using the VST3 Plugin in Ableton Live 12

1. **Create MIDI Track & Add Instrument**
   - New MIDI Track
   - Find "Snowflake Instrument Studio" in Instruments
   - Drag onto track

2. **Load Your Samples**
   - Right-click plugin editor → "Browse Samples"
   - Select `.wav` files to load

3. **Create Your Sound**
   - Use piano keyboard to preview
   - Tweak ADSR envelope
   - Apply filter & EQ
   - Upload background image for custom look

4. **Save Instrument Preset**
   - Click "Save Preset"
   - Name it (e.g., "Ambient Piano")
   - Share `.sis` files freely

5. **Record & Export**
   - Arm MIDI track and play notes
   - Export as audio or MIDI from Ableton

---

## 🎹 Standalone Application

### **Quick Start**

1. **Extract** the ZIP file
2. **Double-click** `Standalone/SnowflakeInstrumentStudio.app`
3. **Grant permission** if macOS asks (first launch only)
4. **Connect MIDI keyboard** (optional)
5. **Start making sounds!**

### **First-Time Permission (Apple Silicon/Intel)**

If you see "cannot open because Apple cannot check it for malicious software":

1. **Open System Preferences** → **Security & Privacy**
2. Look for **SnowflakeInstrumentStudio** in the warning
3. Click **"Open Anyway"**
4. **Confirm** in dialog

(This is normal for unsigned/unsigned apps. Future releases may be code-signed.)

### **Standalone Features**

- ✅ Load/map unlimited WAV samples
- ✅ Full synthesis controls (ADSR, Filter, EQ)
- ✅ Save & load instrument presets
- ✅ Record performances and export WAV
- ✅ MIDI keyboard support
- ✅ Works completely offline

---

## 🔧 Troubleshooting

### **Plugin doesn't appear in Ableton Live**

**Step 1:** Verify installation
```bash
ls ~/Library/Audio/Plug-Ins/VST3/
```
Should show `SnowflakeInstrumentStudio.vst3`

**Step 2:** Rescan plugins
- Ableton Live → Preferences → Library
- Click "Rescan" button

**Step 3:** Clear plugin cache
```bash
rm -rf ~/Library/Caches/com.ableton.live/PluginCache
```

### **"Cannot open" warning on first launch**

- Go to **System Preferences** → **Security & Privacy**
- Find **SnowflakeInstrumentStudio** in blocked apps
- Click **"Open Anyway"**

### **Audio crackles or is silent**

- Check Ableton's **audio device** settings
- Try reducing **buffer size** (lower latency)
- Increase **Master Volume** in plugin
- Check Mac **System Volume** and app volume

### **MIDI keyboard not detected**

- Connect MIDI header to Mac
- Open **Audio MIDI Setup** (Applications → Utilities)
- Check if your device appears
- Try in another app to verify it works
- Update device drivers/firmware

### **Plugin crashes on load**

- Ensure macOS is **fully updated**
- Verify sufficient **RAM** (8+ GB recommended)
- Reinstall the plugin completely

---

## 📋 System Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | macOS 11.0+ (Big Sur+) |
| **Processor** | Intel or Apple Silicon |
| **RAM** | 4 GB minimum (8+ recommended) |
| **Storage** | 500 MB available |
| **DAW** | Ableton Live 12 (VST3) or Logic Pro (AU) |
| **Audio** | Any audio interface or built-in |
| **MIDI** | Optional keyboard/controller |

---

## 🎵 Quick Tutorial

### **5-Minute Sound Design Session**

1. **Open Standalone** (or add to Ableton)
2. **Right-click** → **"Browse Samples"**
3. **Select** a few WAV files (piano, strings, etc.)
4. **Hit "Auto Map"** (spreads samples across keyboard)
5. **Play keys** A-Z or use mouse
6. **Experiment:**
   - Slow down **Attack** for soft entries
   - Lower **Sustain** for natural decay
   - Try **Filter** types (Low Pass = smooth, High Pass = bright)
   - Boost **EQ** for character
7. **Save** your creation as `.sis` file

### **Share Your Instruments**

Your `.sis` files contain:
- ✅ All samples (embedded as audio)
- ✅ All settings (ADSR, filter, EQ)
- ✅ Background image
- ✅ License info

**Perfect for team collaboration!**

---

## 📞 Support

**Issues? Suggestions?**

- 🌐 GitHub: https://github.com/TracyLee1972/Snowflake-Instrument-Studio/issues
- 📧 Email: support@example.com

---

## ⭐ Advanced Tips

1. **Keyboard Shortcuts (Standalone):**
   ```
   A S D F G H J K L ; '  = White keys (C-B)
   W E T Y U O P          = Black keys (C#-A#)
   Z / X                  = Octave down / up
   Space (hold)           = Sustain pedal
   ```

2. **Sample Auto-Mapping:**
   - Name WAVs with note info: `Piano_C4.wav`, `Bell_A3.wav`
   - Plugin auto-detects MIDI note from filename
   - Or manually set root note

3. **Round-Robin Sampling:**
   Great for:
   - Realistic drums (multiple hits per velocity)
   - Orchestral strings (human-like variation)
   - Any sound that benefits from variation

4. **Integration with Logic Pro:**
   If you build AU version, appears in Logic as **Instrument**
   - Same features as VST3
   - Launches editor in Logic mixer

---

## 📜 License & Attribution

Snowflake Instrument Studio © 2026 TracyLee1972  
Licensed under MIT License (see LICENSE file)

Inspired by professional samplers: Kontakt, Decent Sampler, Element Studio

---

**Ready to make amazing instruments? Let's go! 🎶❄️**
