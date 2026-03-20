/**
 * audioEngine.js
 * Web Audio API engine: sample playback, ADSR, filter, 3-band EQ, pitch shift.
 * All audio nodes are created lazily after a user gesture to satisfy autoplay policy.
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;

    // Master chain: gain → EQ low → EQ mid → EQ high → filter → destination
    /** @type {GainNode|null} */
    this._masterGain = null;
    /** @type {BiquadFilterNode|null} */
    this._eqLow = null;
    /** @type {BiquadFilterNode|null} */
    this._eqMid = null;
    /** @type {BiquadFilterNode|null} */
    this._eqHigh = null;
    /** @type {BiquadFilterNode|null} */
    this._filter = null;

    // Parameters (plain objects; actual AudioNode params updated via setters)
    this.params = {
      attack:     0.01,
      decay:      0.1,
      sustain:    0.8,
      release:    0.3,
      filterFreq: 20000,
      filterRes:  1,
      filterType: 'lowpass',
      pitch:      0,       // semitones
      velocity:   0.8,
      volume:     0.8,
      eqLow:      0,       // dB
      eqMid:      0,
      eqHigh:     0,
      roundRobin: false,
    };

    /** @type {Map<number,AudioBuffer>} MIDI note → decoded AudioBuffer */
    this.sampleMap = new Map();

    /** @type {Map<number, {source:AudioBufferSourceNode, gain:GainNode}[]>} active voices */
    this._voices = new Map();

    // Round-robin counters per MIDI note
    /** @type {Map<number, number>} */
    this._rrCounters = new Map();
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Must be called from a user-gesture handler before any playback.
   * Idempotent — safe to call multiple times.
   * @returns {Promise<void>}
   */
  async init() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') {
        await this._ctx.resume();
      }
      return;
    }

    this._ctx = new AudioContext();

    // Build master chain
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this.params.volume;

    this._eqLow = this._ctx.createBiquadFilter();
    this._eqLow.type = 'lowshelf';
    this._eqLow.frequency.value = 250;
    this._eqLow.gain.value = this.params.eqLow;

    this._eqMid = this._ctx.createBiquadFilter();
    this._eqMid.type = 'peaking';
    this._eqMid.frequency.value = 1000;
    this._eqMid.Q.value = 1;
    this._eqMid.gain.value = this.params.eqMid;

    this._eqHigh = this._ctx.createBiquadFilter();
    this._eqHigh.type = 'highshelf';
    this._eqHigh.frequency.value = 8000;
    this._eqHigh.gain.value = this.params.eqHigh;

    this._filter = this._ctx.createBiquadFilter();
    this._filter.type = this.params.filterType;
    this._filter.frequency.value = this.params.filterFreq;
    this._filter.Q.value = this.params.filterRes;

    // Connect chain: master → eqLow → eqMid → eqHigh → filter → destination
    this._masterGain
      .connect(this._eqLow)
      .connect(this._eqMid)
      .connect(this._eqHigh)
      .connect(this._filter)
      .connect(this._ctx.destination);
  }

  /* ------------------------------------------------------------------ */
  /* Sample loading                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Decode an ArrayBuffer and map it to a MIDI note range.
   * @param {ArrayBuffer} arrayBuffer  Raw WAV data
   * @param {number}      rootNote     MIDI note number mapped to root pitch
   * @param {number}      [loNote]     Lowest MIDI note in range (default rootNote)
   * @param {number}      [hiNote]     Highest MIDI note in range (default rootNote)
   * @returns {Promise<void>}
   */
  async loadSample(arrayBuffer, rootNote, loNote, hiNote) {
    await this.init();
    const buffer = await this._ctx.decodeAudioData(arrayBuffer.slice(0));
    const lo = loNote !== undefined ? loNote : rootNote;
    const hi = hiNote !== undefined ? hiNote : rootNote;

    for (let note = lo; note <= hi; note++) {
      // Store buffer. For multi-sample support, key = MIDI note.
      // If multiple samples overlap this note, last one wins — callers
      // should assign non-overlapping ranges.
      if (!this.sampleMap.has(note)) {
        this.sampleMap.set(note, []);
      }
      this.sampleMap.get(note).push({ buffer, rootNote });
    }
  }

  /**
   * Remove all sample data.
   */
  clearSamples() {
    this.sampleMap.clear();
    this._rrCounters.clear();
  }

  /**
   * Remove sample entries for a given root note.
   * @param {number} rootNote
   */
  removeSample(rootNote) {
    for (const [note, entries] of this.sampleMap.entries()) {
      const filtered = entries.filter(e => e.rootNote !== rootNote);
      if (filtered.length === 0) {
        this.sampleMap.delete(note);
      } else {
        this.sampleMap.set(note, filtered);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Playback                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Play a MIDI note.
   * @param {number} midiNote  0–127
   * @param {number} [velocity] 0–1
   */
  async noteOn(midiNote, velocity = 1) {
    await this.init();

    const entries = this.sampleMap.get(midiNote);
    if (!entries || entries.length === 0) return;

    // Round-robin selection
    let idx = 0;
    if (this.params.roundRobin && entries.length > 1) {
      const counter = this._rrCounters.get(midiNote) || 0;
      idx = counter % entries.length;
      this._rrCounters.set(midiNote, idx + 1);
    }

    const { buffer, rootNote } = entries[idx];

    // Pitch-shift: combine global pitch param + semitone offset from root
    const semitoneDiff = (midiNote - rootNote) + this.params.pitch;
    const playbackRate = Math.pow(2, semitoneDiff / 12);

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const envGain = this._ctx.createGain();
    const atkEnd     = this._ctx.currentTime + this.params.attack;
    const decayEnd   = atkEnd + this.params.decay;
    const peakVel    = velocity * this.params.velocity;

    envGain.gain.setValueAtTime(0, this._ctx.currentTime);
    envGain.gain.linearRampToValueAtTime(peakVel, atkEnd);
    envGain.gain.linearRampToValueAtTime(peakVel * this.params.sustain, decayEnd);

    source.connect(envGain);
    envGain.connect(this._masterGain);
    source.start();

    // Track active voice
    if (!this._voices.has(midiNote)) {
      this._voices.set(midiNote, []);
    }
    this._voices.get(midiNote).push({ source, gain: envGain });
  }

  /**
   * Release a MIDI note (apply release envelope then stop).
   * @param {number} midiNote
   */
  noteOff(midiNote) {
    if (!this._ctx) return;
    const voices = this._voices.get(midiNote);
    if (!voices) return;

    voices.forEach(({ source, gain }) => {
      const now = this._ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + this.params.release);
      try {
        source.stop(now + this.params.release + 0.01);
      } catch (_) {
        // source may have already stopped naturally
      }
    });

    this._voices.delete(midiNote);
  }

  /**
   * Silence all active voices immediately.
   */
  allNotesOff() {
    if (!this._ctx) return;
    for (const [note] of this._voices) {
      this.noteOff(note);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Parameter setters                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * @param {number} v attack time in seconds
   */
  setAttack(v)  { this.params.attack  = Math.max(0.001, v); }

  /**
   * @param {number} v decay time in seconds
   */
  setDecay(v)   { this.params.decay   = Math.max(0.001, v); }

  /**
   * @param {number} v 0–1
   */
  setSustain(v) { this.params.sustain = Math.min(1, Math.max(0, v)); }

  /**
   * @param {number} v release time in seconds
   */
  setRelease(v) { this.params.release = Math.max(0.001, v); }

  /**
   * @param {number} hz
   */
  setFilterFreq(hz) {
    this.params.filterFreq = hz;
    if (this._filter) this._filter.frequency.value = hz;
  }

  /**
   * @param {number} q
   */
  setFilterRes(q) {
    this.params.filterRes = q;
    if (this._filter) this._filter.Q.value = q;
  }

  /**
   * @param {BiquadFilterType} type
   */
  setFilterType(type) {
    this.params.filterType = type;
    if (this._filter) this._filter.type = type;
  }

  /**
   * @param {number} dB  -12 to +12
   */
  setEqLow(dB) {
    this.params.eqLow = dB;
    if (this._eqLow) this._eqLow.gain.value = dB;
  }

  /**
   * @param {number} dB
   */
  setEqMid(dB) {
    this.params.eqMid = dB;
    if (this._eqMid) this._eqMid.gain.value = dB;
  }

  /**
   * @param {number} dB
   */
  setEqHigh(dB) {
    this.params.eqHigh = dB;
    if (this._eqHigh) this._eqHigh.gain.value = dB;
  }

  /**
   * @param {number} semitones  -24 to +24
   */
  setPitch(semitones) {
    this.params.pitch = semitones;
  }

  /**
   * @param {number} v  0–1
   */
  setVelocitySensitivity(v) {
    this.params.velocity = Math.min(1, Math.max(0, v));
  }

  /**
   * @param {number} v  0–1
   */
  setVolume(v) {
    const clamped = Math.min(1, Math.max(0, v));
    this.params.volume = clamped;
    if (this._masterGain) this._masterGain.gain.value = clamped;
  }

  /**
   * @param {boolean} enabled
   */
  setRoundRobin(enabled) {
    this.params.roundRobin = enabled;
    if (!enabled) this._rrCounters.clear();
  }

  /* ------------------------------------------------------------------ */
  /* Utility                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Returns the underlying AudioContext — may be null before init().
   * @returns {AudioContext|null}
   */
  getContext() {
    return this._ctx;
  }
}
