/**
 * PresetManager — Serialises and deserialises the full instrument state
 * (samples embedded as base64, settings, background image) to/from .sis files.
 */
class PresetManager {
  /**
   * @param {AudioEngine}   audioEngine
   * @param {SampleManager} sampleManager
   */
  constructor(audioEngine, sampleManager) {
    this._engine  = audioEngine;
    this._samples = sampleManager;
  }

  /* ── Collect current state into a plain object ── */
  async buildPreset(opts = {}) {
    const includeSamples = opts.includeSamples !== false;
    const includeImage   = opts.includeImage   !== false;
    const instrumentName = opts.instrumentName || 'My Instrument';
    const license        = opts.license        || 'personal';
    const bgDataUrl      = opts.bgDataUrl      || null;

    const engine = this._engine;
    const preset = {
      version: 1,
      name:    instrumentName,
      license,
      created: new Date().toISOString(),
      settings: {
        attack:          engine.attack,
        decay:           engine.decay,
        sustain:         engine.sustain,
        release:         engine.release,
        masterVolume:    engine.masterVolume,
        velocitySens:    engine.velocitySens,
        pitchCoarse:     engine.pitchCoarse,
        pitchFine:       engine.pitchFine,
        filterType:      engine.filterType,
        filterFreq:      engine.filterFreq,
        filterQ:         engine.filterQ,
        filterGain:      engine.filterGain,
        eqLow:           engine.eqLow,
        eqMid:           engine.eqMid,
        eqHigh:          engine.eqHigh,
        roundRobinEnabled: engine.roundRobinEnabled,
      },
      samples: [],
      backgroundImage: null,
    };

    if (includeSamples) {
      for (const s of this._samples.getSamples()) {
        const b64 = PresetManager._arrayBufferToBase64(s.arrayBuffer);
        preset.samples.push({
          name:     s.name,
          rootNote: s.rootNote,
          loNote:   s.loNote,
          hiNote:   s.hiNote,
          data:     b64,
        });
      }
    }

    if (includeImage && bgDataUrl) {
      preset.backgroundImage = bgDataUrl;
    }

    return preset;
  }

  /* ── Serialise to JSON string and trigger browser download ── */
  async saveToFile(opts = {}) {
    const preset = await this.buildPreset(opts);
    const json   = JSON.stringify(preset, null, 2);
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href     = url;
    a.download = (preset.name.replace(/[^a-z0-9_\-]/gi, '_') || 'instrument') + '.sis';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ── Load a preset from a File object, return the preset object ── */
  async loadFromFile(file) {
    const text   = await file.text();
    const preset = JSON.parse(text);
    return this.applyPreset(preset);
  }

  /* ── Apply a preset object to the engine and sample manager ── */
  async applyPreset(preset) {
    if (!preset || preset.version !== 1) throw new Error('Invalid or unsupported preset format');

    // Restore samples
    const sampleItems = [];
    for (const s of (preset.samples || [])) {
      const ab = PresetManager._base64ToArrayBuffer(s.data);
      sampleItems.push({ name: s.name, arrayBuffer: ab, rootNote: s.rootNote, loNote: s.loNote, hiNote: s.hiNote });
    }
    await this._samples.restoreFromPreset(sampleItems);

    // Restore settings
    const st = preset.settings || {};
    const e  = this._engine;

    if (st.attack      != null) e.setAttack(st.attack);
    if (st.decay       != null) e.setDecay(st.decay);
    if (st.sustain     != null) e.setSustain(st.sustain);
    if (st.release     != null) e.setRelease(st.release);
    if (st.masterVolume != null) e.setMasterVolume(st.masterVolume);
    if (st.velocitySens != null) e.velocitySens = st.velocitySens;
    if (st.pitchCoarse != null) e.pitchCoarse = st.pitchCoarse;
    if (st.pitchFine   != null) e.pitchFine   = st.pitchFine;
    if (st.filterType  != null) e.setFilterType(st.filterType);
    if (st.filterFreq  != null) e.setFilterFreq(st.filterFreq);
    if (st.filterQ     != null) e.setFilterQ(st.filterQ);
    if (st.filterGain  != null) e.setFilterGain(st.filterGain);
    if (st.eqLow       != null) e.setEqLow(st.eqLow);
    if (st.eqMid       != null) e.setEqMid(st.eqMid);
    if (st.eqHigh      != null) e.setEqHigh(st.eqHigh);
    if (st.roundRobinEnabled != null) e.roundRobinEnabled = st.roundRobinEnabled;

    return preset;
  }

  /* ── base64 helpers ── */
  static _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  static _base64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    return buf;
  }
}
