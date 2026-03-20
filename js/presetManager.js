/**
 * presetManager.js
 * Save / load / share Snowflake Instrument Studio (.sis) preset files.
 * .sis format is a JSON envelope containing base64-encoded WAV data.
 */

import { setControlValue } from './controls.js';

/**
 * @typedef {Object} SisPreset
 * @property {string}  version
 * @property {string}  name
 * @property {Object}  params
 * @property {Array<{id:string,name:string,rootNote:number,loNote:number,hiNote:number,data:string}>} samples
 * @property {string}  [image]  - base64 data URL
 */

export class PresetManager {
  /**
   * @param {{
   *   audioEngine:    import('./audioEngine.js').AudioEngine,
   *   sampleManager:  import('./sampleManager.js').SampleManager,
   *   getPresetName:  () => string,
   *   setPresetName:  (name: string) => void,
   *   getImageSrc:    () => string,
   *   setImageSrc:    (src: string) => void,
   * }} opts
   */
  constructor(opts) {
    this._engine   = opts.audioEngine;
    this._sm       = opts.sampleManager;
    this._getName  = opts.getPresetName;
    this._setName  = opts.setPresetName;
    this._getImg   = opts.getImageSrc;
    this._setImg   = opts.setImageSrc;
  }

  /* ------------------------------------------------------------------ */
  /* Save                                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Serialise the current state and trigger a download of a .sis file.
   */
  async save() {
    const preset = await this._serialise();
    const json   = JSON.stringify(preset, null, 2);
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href     = url;
    a.download = `${preset.name.replace(/[^a-z0-9_\- ]/gi, '_')}.sis`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ------------------------------------------------------------------ */
  /* Load                                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Load a .sis file from an ArrayBuffer, restore state.
   * @param {ArrayBuffer} arrayBuffer
   */
  async load(arrayBuffer) {
    let preset;
    try {
      const text = new TextDecoder().decode(arrayBuffer);
      preset     = JSON.parse(text);
    } catch {
      throw new Error('Invalid preset file — could not parse JSON.');
    }

    this._validatePreset(preset);
    await this._restore(preset);
  }

  /* ------------------------------------------------------------------ */
  /* Share (copy URL with base64 payload to clipboard)                    */
  /* ------------------------------------------------------------------ */

  /**
   * Encode preset as base64 and copy a shareable URL fragment to clipboard.
   * Recipient can paste the fragment into the browser URL bar.
   */
  async share() {
    const preset   = await this._serialise();
    const json     = JSON.stringify(preset);
    const encoded  = _utf8ToBase64(json);
    const shareUrl = `${window.location.origin}${window.location.pathname}#preset=${encoded}`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
    return shareUrl;
  }

  /**
   * Load preset from URL fragment if present.
   */
  async loadFromUrl() {
    const hash = window.location.hash;
    if (!hash.startsWith('#preset=')) return;
    try {
      const encoded = hash.slice('#preset='.length);
      const json    = _base64ToUtf8(encoded);
      const preset  = JSON.parse(json);
      this._validatePreset(preset);
      await this._restore(preset);
    } catch (err) {
      console.warn('Failed to load preset from URL:', err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* New (reset everything)                                               */
  /* ------------------------------------------------------------------ */

  newPreset() {
    this._sm.clearAll();
    this._setName('Untitled Instrument');
    this._setImg('');
    // Reset engine to defaults
    const e = this._engine;
    e.setAttack(0.01);
    e.setDecay(0.1);
    e.setSustain(0.8);
    e.setRelease(0.3);
    e.setFilterFreq(20000);
    e.setFilterRes(1);
    e.setFilterType('lowpass');
    e.setEqLow(0);
    e.setEqMid(0);
    e.setEqHigh(0);
    e.setPitch(0);
    e.setVelocitySensitivity(0.8);
    e.setVolume(0.8);
    e.setRoundRobin(false);

    // Reset visual controls
    const defaults = {
      attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3,
      filterFreq: 20000, filterRes: 1, filterType: 'lowpass',
      eqLow: 0, eqMid: 0, eqHigh: 0,
      pitch: 0, velocity: 0.8, volume: 0.8,
      roundRobin: false,
    };
    for (const [k, v] of Object.entries(defaults)) {
      setControlValue(k, v);
    }
  }

  /**
   * Public setter used by UI flows such as rename.
   * @param {string} name
   */
  setPresetName(name) {
    this._setName(name);
  }

  /* ------------------------------------------------------------------ */
  /* Internal: serialise                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * @returns {Promise<SisPreset>}
   */
  async _serialise() {
    const p = this._engine.params;
    const samplesData = await Promise.all(
      this._sm.samples.map(async (entry) => {
        const b64 = _arrayBufferToBase64(entry.buffer);
        return {
          id:       entry.id,
          name:     entry.name,
          rootNote: entry.rootNote,
          loNote:   entry.loNote,
          hiNote:   entry.hiNote,
          data:     b64,
        };
      })
    );

    return {
      version: '1.0',
      name:    this._getName(),
      params: {
        attack:     p.attack,
        decay:      p.decay,
        sustain:    p.sustain,
        release:    p.release,
        filterFreq: p.filterFreq,
        filterRes:  p.filterRes,
        filterType: p.filterType,
        pitch:      p.pitch,
        velocity:   p.velocity,
        volume:     p.volume,
        eqLow:      p.eqLow,
        eqMid:      p.eqMid,
        eqHigh:     p.eqHigh,
        roundRobin: p.roundRobin,
      },
      samples: samplesData,
      image:   this._getImg() || '',
    };
  }

  /* ------------------------------------------------------------------ */
  /* Internal: restore                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * @param {SisPreset} preset
   */
  async _restore(preset) {
    // Clear existing state
    this._sm.clearAll();
    this._engine.clearSamples();

    // Name
    this._setName(preset.name);

    // Image
    if (preset.image) this._setImg(preset.image);

    // Params
    const e = this._engine;
    const p = preset.params;

    e.setAttack(p.attack);
    e.setDecay(p.decay);
    e.setSustain(p.sustain);
    e.setRelease(p.release);
    e.setFilterFreq(p.filterFreq);
    e.setFilterRes(p.filterRes);
    e.setFilterType(p.filterType);
    e.setEqLow(p.eqLow);
    e.setEqMid(p.eqMid);
    e.setEqHigh(p.eqHigh);
    e.setPitch(p.pitch);
    e.setVelocitySensitivity(p.velocity);
    e.setVolume(p.volume);
    e.setRoundRobin(p.roundRobin);

    // Update visual controls
    for (const [k, v] of Object.entries(p)) {
      setControlValue(k, v);
    }

    // Samples
    for (const s of preset.samples) {
      const raw = _base64ToArrayBuffer(s.data);
      await e.loadSample(raw, s.rootNote, s.loNote, s.hiNote);
      const entry = {
        id:       s.id,
        name:     s.name,
        buffer:   raw,
        rootNote: s.rootNote,
        loNote:   s.loNote,
        hiNote:   s.hiNote,
      };
      this._sm.addEntry(entry, { triggerOnAdded: false });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Validation                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * @param {unknown} preset
   */
  _validatePreset(preset) {
    if (typeof preset !== 'object' || preset === null) {
      throw new Error('Invalid preset: not an object.');
    }
    if (preset.version !== '1.0') {
      throw new Error(`Unsupported preset version: ${preset.version}`);
    }
    if (typeof preset.params !== 'object') {
      throw new Error('Invalid preset: missing params.');
    }
    if (!Array.isArray(preset.samples)) {
      throw new Error('Invalid preset: samples must be an array.');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Base64 helpers (no eval, no external libs)                           */
/* ------------------------------------------------------------------ */

/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function _arrayBufferToBase64(buffer) {
  const bytes   = new Uint8Array(buffer);
  const binStr  = Array.from(bytes, b => String.fromCharCode(b)).join('');
  return btoa(binStr);
}

/**
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function _base64ToArrayBuffer(base64) {
  const binStr = atob(base64);
  const bytes  = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * @param {string} text
 * @returns {string}
 */
function _utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

/**
 * @param {string} base64
 * @returns {string}
 */
function _base64ToUtf8(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
