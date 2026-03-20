# Quick Start Guide

Get Snowflake Instrument Studio VST3 + Standalone running in **5 minutes**.

---

## 📥 Download Pre-Built

**👉 Fastest way to get started:**

1. Go to [Releases](https://github.com/TracyLee1972/Snowflake-Instrument-Studio/releases)
2. Download:
   - `SnowflakeInstrumentStudio-1.0.0-Windows.zip` (Windows 11)
   - `SnowflakeInstrumentStudio-1.0.0-macOS.zip` (macOS)
3. Extract anywhere
4. Open `INSTALL_Windows.md` or `INSTALL_macOS.md`

✅ **Done!** Launch plugin or standalone app.

---

## 🛠️ Build from Source (10 minutes)

### **Windows 11**

```powershell
# 1. Clone
git clone https://github.com/TracyLee1972/Snowflake-Instrument-Studio.git
cd Snowflake-Instrument-Studio/vst3-plugin

# 2. Build (automated)
.\build-win.bat

# 3. Install VST3
# Copy output to: C:\Program Files\Common Files\VST3\

# 4. Launch Standalone
# Run: build-win\SnowflakeInstrumentStudio-Standalone_artefacts\Release\SnowflakeInstrumentStudio.exe
```

### **macOS**

```bash
# 1. Clone
git clone https://github.com/TracyLee1972/Snowflake-Instrument-Studio.git
cd Snowflake-Instrument-Studio/vst3-plugin

# 2. Build (automated)
chmod +x build-mac.sh
./build-mac.sh

# 3. Install VST3
# cp -r build-mac/*/Release/VST3/*.vst3 ~/Library/Audio/Plug-Ins/VST3/

# 4. Launch Standalone
# open build-mac/SnowflakeInstrumentStudio-Standalone_artefacts/Release/SnowflakeInstrumentStudio.app
```

---

## 🎹 First Sound (2 minutes)

### **Using Standalone App**

```
1. Launch application
2. Click "Load Samples" → select WAV files
3. Click "Auto Map"
4. Press keys A-Z or use mouse on keyboard
5. Adjust ADSR/Filter knobs
6. Enjoy! 🎵
```

### **Using VST3 in Ableton Live 12**

```
1. Create new Instrument MIDI track
2. Find "Snowflake Instrument Studio" in browser
3. Drag to track
4. Load samples via plugin editor
5. Record MIDI notes
6. Play! 🎶
```

---

## 📚 Full Documentation

- **[README.md](README.md)** — Features overview
- **[BUILD.md](BUILD.md)** — Detailed build instructions
- **[INSTALL_Windows.md](INSTALL_Windows.md)** — Windows setup + troubleshooting
- **[INSTALL_macOS.md](INSTALL_macOS.md)** — macOS setup + troubleshooting

---

## 🤔 Frequently Asked Questions

**Q: Do I need a DAW?**  
A: No! Use standalone. Or use in Ableton Live 12, Reaper, Cubase, etc. as VST3.

**Q: Can I share instruments with others?**  
A: Yes! Save as `.sis` preset. It includes samples, settings, and image. Share freely.

**Q: What sample formats do you support?**  
A: WAV files (typical instrument samples). Other formats in future.

**Q: Does it work on Linux?**  
A: Not yet. Windows 11 and macOS only for now.

**Q: Can I use it in Logic Pro?**  
A: VST3 works with AU/VST3 compatible hosts. Need AU plugin for native Logic support (planned).

---

## 🆘 Need Help?

- 📖 Check [INSTALL docs](INSTALL_Windows.md) for troubleshooting
- 🐛 [Report bugs on GitHub](https://github.com/TracyLee1972/Snowflake-Instrument-Studio/issues)
- 💬 [Ask questions in Discussions](https://github.com/TracyLee1972/Snowflake-Instrument-Studio/discussions)

---

**Ready? Let's make amazing instruments! 🎶❄️**
