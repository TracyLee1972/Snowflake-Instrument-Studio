# Snowflake Instrument Studio VST3 & Standalone
## Complete Installation Guide for Windows 11 & Ableton Live 12

**Version:** 1.0.0  
**Platform:** Windows 11 x64  
**Compatibility:** Ableton Live 12 Lite, VST3 hosts, Standalone mode

---

## 📦 Package Contents

```
SnowflakeInstrumentStudio-1.0.0-Windows/
├── VST3/
│   └── SnowflakeInstrumentStudio.vst3/     (VST3 Plugin)
├── Standalone/
│   └── SnowflakeInstrumentStudio.exe       (Standalone Application)
├── Documentation/
│   ├── README.md
│   └── INSTALL_Windows.md
└── LICENSE
```

---

## 🎹 Installation - VST3 Plugin for Ableton Live 12

### **Method 1: Automatic (Recommended)**

1. **Extract the ZIP file** to your Downloads folder
2. **Double-click** `VST3/SnowflakeInstrumentStudio.vst3`
3. Choose **"Install"** when prompted
4. **Restart Ableton Live 12**
5. The plugin appears in your Instruments list ✅

### **Method 2: Manual Installation**

1. **Extract** the ZIP file
2. **Copy** `VST3/SnowflakeInstrumentStudio.vst3`
3. **Navigate to:**
   ```
   C:\Program Files\Common Files\VST3\
   ```
   (If folder doesn't exist, create it)
4. **Paste** the .vst3 folder there
5. **Restart Ableton Live 12**
6. Go to **Live → Preferences → File/Folder** → rescan plugin folders (or restart)

### **For 32-bit DAWs:**
Some older workflows may need VST2 format. Please request VST2 builds separately.

---

## 🎜 Using the VST3 Plugin in Ableton Live 12

1. **Drag an Instrument to a MIDI track**
   - Find "Snowflake Instrument Studio" in your VST Instruments
   - Drag it onto an empty MIDI track

2. **Load Samples**
   - Right-click the plugin editor
   - Select **"Browse Samples"**
   - Select WAV files to load

3. **Create Your Instrument**
   - Use the **Piano Keyboard** to play notes
   - Adjust **ADSR, Filter, EQ** knobs
   - **Add background image** for visual design
   - **Enable Round Robin** for variety

4. **Save Your Instrument**
   - Click **"Save Preset"**
   - Share `.sis` files with others

5. **Record & Export**
   - Arm your track and record in Ableton
   - Export as audio or MIDI to integrate into your tracks

---

## 🎹 Standalone Mode

### **Quick Start**

1. **Extract** the ZIP file
2. **Double-click** `Standalone/SnowflakeInstrumentStudio.exe`
3. **Load MIDI keyboard** or use mouse to play
4. The standalone works **independently** of any DAW

### **Standalone Features**

- ✅ Load and map WAV files
- ✅ Full ADSR, Filter, EQ controls
- ✅ Record melodies and export as WAV
- ✅ Save/load instrument presets
- ✅ Works with any MIDI keyboard

---

## 🔧 Troubleshooting

### **Plugin doesn't appear in Ableton Live**

**Fix 1:** Rescan VST3 folder
- Ableton Live → Preferences → File/Folder
- Click **"Rescan"** button

**Fix 2:** Check installation path
```PowerShell
# Verify VST3 is in correct location:
Get-ChildItem "C:\Program Files\Common Files\VST3\" | Select-Object Name
```

**Fix 3:** Verify file not blocked
- Right-click `SnowflakeInstrumentStudio.vst3`
- Properties → General → Check "Unblock" → Apply → OK

### **Audio is silent or crackles**

- Increase **Master Volume** slider
- Check Ableton Live's input/output device settings
- Try reducing **Buffer Size** in Ableton (lower = more responsive)

### **MIDI keyboard doesn't work in standalone**

- Check that keyboard is connected and recognized by Windows
- Try another MIDI app to verify keyboard works
- Update MIDI/USB drivers

### **Crash on startup**

- Ensure Windows 11 is **fully updated**
- Verify you have **Direct X 11 or higher** installed
- Reinstall the plugin from scratch

---

## 📋 System Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 11 x64 |
| **RAM** | 4 GB minimum (8+ recommended) |
| **Storage** | 500 MB free space |
| **DAW** | Ableton Live 12 Lite (or any VST3 host) |
| **Audio Interface** | Any Core Audio or ASIO device |
| **MIDI** | Optional (keyboard, controller, etc.) |

---

## 🎵 Getting Started Tutorial

### **Create Your First Instrument** (5 minutes)

1. **Open Standalone** or create new MIDI track in Ableton
2. **Click "Load Samples"** → select a few piano or synth WAV files
3. **Click "Auto Map"** to spread samples across keyboard
4. **Play notes** using mouse or keyboard (A-Z to play)
5. **Experiment:**
   - Drag sliders: Attack (faster), Sustain (louder hold)
   - Try different Filter types
   - Boost EQ for character
6. **Save:** Click "Save Instrument" → name it → share the .sis file

### **Load Someone's Instrument**

1. **Open Snowflake**
2. **Click "Load Preset"**
3. **Browse** to a `.sis` file
4. **Play immediately** – all samples & settings loaded!

---

## 📞 Support & Issues

**Questions or bugs?**

- 🔗 GitHub: https://github.com/TracyLee1972/Snowflake-Instrument-Studio
- 📝 Issues: Report bugs here for fixes

**Want to share your instruments?**

- Create a `.sis` file and share with friends/colleagues
- Include a screenshot of your background image
- Tag licensing: Personal Use, Commercial, CC-BY, etc.

---

## 📜 License

Snowflake Instrument Studio © 2026 TracyLee1972

See LICENSE file for full terms.

---

## ⭐ Tips & Tricks

1. **Keyboard Shortcuts (Standalone/Piano):**
   - `A S D F G H J K L ; '` = White keys
   - `W E T Y U O P` = Black keys
   - `Z` / `X` = Octave down/up
   - `Space` = Sustain pedal

2. **Sample Naming:**
   Upload WAVs with note info for automatic mapping:
   - `piano_C4.wav` → automatically detects C4
   - `kick_A2.wav` → maps to A2
   - Generic names OK too – use manual mapping

3. **Round Robin:**
   - Enable for **drum kits** and **string instruments**
   - Cycles through multiple samples per note
   - Sounds less repetitive in production

4. **Sharing Presets:**
   - `.sis` files include audio, settings, AND images
   - Recipients don't need source WAVs
   - Great for collaboration & templates

---

**Happy Sound Design! 🎶❄️**
