/**
 * AudioEngine — Web Audio API sampler backend
 * Supports: multi-sample mapping, pitch-shifting, ADSR, filter, 3-band EQ,
 *           velocity sensitivity, round-robin, master volume/pitch.
 */
class AudioEngine {
  constructor() {
    this._ctx = null;       // AudioContext (lazy init on first gesture)
    this._samples = new Map();  // noteNumber -> AudioBuffer[]  (round-robin array)
    this._rrIndex  = new Map();  // noteNumber -> current RR index
    this._rootNote = new Map();  // noteNumber (of the buffer) -> rootNote MIDI
    this._loNote   = new Map();  // buffer-rootNote -> loNote
    this._hiNote   = new Map();  // buffer-rootNote -> hiNote
    this._active   = new Map();  // playing noteNumber -> { source, env }

    // Parameters
    this.attack   = 0.01;
    this.decay    = 0.1;
    this.sustain  = 0.8;
    this.release  = 0.3;
    this.masterVolume     = 0.8;
    this.velocitySens     = 1.0;
    this.pitchCoarse      = 0;    // semitones
    this.pitchFine        = 0;    // cents
    this.filterType       = 'lowpass';
    this.filterFreq       = 20000;
    this.filterQ          = 1.0;
    this.filterGain       = 0;
    this.eqLow            = 0;
    this.eqMid            = 0;
    this.eqHigh           = 0;
    this.roundRobinEnabled = false;

    // Nodes (created lazily)
    this._masterGain   = null;
    this._filter       = null;
    this._eqLow        = null;
    this._eqMid        = null;
    this._eqHigh       = null;
  }

  /* ── Lazy context init (must be called from user gesture) ── */
  _ensureCtx() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this.masterVolume;

    this._filter = this._ctx.createBiquadFilter();
    this._filter.type      = this.filterType;
    this._filter.frequency.value = this.filterFreq;
    this._filter.Q.value   = this.filterQ;
    this._filter.gain.value = this.filterGain;

    this._eqLow  = this._ctx.createBiquadFilter();
    this._eqLow.type = 'lowshelf'; this._eqLow.frequency.value = 250;
    this._eqMid  = this._ctx.createBiquadFilter();
    this._eqMid.type = 'peaking';  this._eqMid.frequency.value = 1000; this._eqMid.Q.value = 1;
    this._eqHigh = this._ctx.createBiquadFilter();
    this._eqHigh.type = 'highshelf'; this._eqHigh.frequency.value = 4000;

    this._filter.connect(this._eqLow);
    this._eqLow.connect(this._eqMid);
    this._eqMid.connect(this._eqHigh);
    this._eqHigh.connect(this._masterGain);
    this._masterGain.connect(this._ctx.destination);
  }

  /* Resume suspended context (Safari etc.) */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  }

  /* ── Load a WAV ArrayBuffer and store against a MIDI note number ── */
  async loadBuffer(arrayBuffer, rootNote) {
    this._ensureCtx();
    const buf = await this._ctx.decodeAudioData(arrayBuffer);
    const arr = this._samples.get(rootNote) || [];
    arr.push(buf);
    this._samples.set(rootNote, arr);
    this._rrIndex.set(rootNote, 0);
    return buf;
  }

  /* ── Store a pre-decoded buffer (used by PresetManager) ── */
  storeBuffer(audioBuffer, rootNote) {
    const arr = this._samples.get(rootNote) || [];
    arr.push(audioBuffer);
    this._samples.set(rootNote, arr);
    this._rrIndex.set(rootNote, 0);
  }

  /* ── Remove all samples for a note ── */
  clearNote(noteNumber) {
    this._samples.delete(noteNumber);
    this._rrIndex.delete(noteNumber);
  }

  clearAll() {
    this._samples.clear();
    this._rrIndex.clear();
    this._rootNote.clear();
    this._loNote.clear();
    this._hiNote.clear();
  }

  /* ── Find the best buffer for a given MIDI note ── */
  _findBuffer(noteNumber) {
    // Exact match first
    if (this._samples.has(noteNumber) && this._samples.get(noteNumber).length) {
      return { buffers: this._samples.get(noteNumber), rootNote: noteNumber };
    }
    // Search for nearest mapped root note whose lo/hi range covers noteNumber
    let bestRootNote = null;
    let bestDist = Infinity;
    for (const [root, bufs] of this._samples) {
      if (!bufs.length) continue;
      const lo = this._loNote.get(root) ?? 0;
      const hi = this._hiNote.get(root) ?? 127;
      if (noteNumber >= lo && noteNumber <= hi) {
        const dist = Math.abs(noteNumber - root);
        if (dist < bestDist) { bestDist = dist; bestRootNote = root; }
      }
    }
    if (bestRootNote !== null) {
      return { buffers: this._samples.get(bestRootNote), rootNote: bestRootNote };
    }
    // Fallback: nearest root note ignoring range
    for (const [root, bufs] of this._samples) {
      if (!bufs.length) continue;
      const dist = Math.abs(noteNumber - root);
      if (dist < bestDist) { bestDist = dist; bestRootNote = root; }
    }
    if (bestRootNote !== null) {
      return { buffers: this._samples.get(bestRootNote), rootNote: bestRootNote };
    }
    return null;
  }

  /* ── Note On ── */
  noteOn(noteNumber, velocity = 1.0) {
    this._ensureCtx();
    this.resume();
    this.noteOff(noteNumber, true); // stop any already-sounding version

    const found = this._findBuffer(noteNumber);
    if (!found) return;

    const { buffers, rootNote } = found;
    // Round robin selection
    let idx = this._rrIndex.get(rootNote) || 0;
    if (!this.roundRobinEnabled) idx = 0;
    const buffer = buffers[idx % buffers.length];
    if (this.roundRobinEnabled) this._rrIndex.set(rootNote, idx + 1);

    const now = this._ctx.currentTime;

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;

    // Pitch shift: semitones from root note + global pitch offsets
    const semitones = (noteNumber - rootNote) + this.pitchCoarse + (this.pitchFine / 100);
    source.playbackRate.value = Math.pow(2, semitones / 12);

    // Velocity → gain (linear blend with flat curve)
    const velGain = this.velocitySens > 0
      ? Math.pow(velocity, 1 / Math.max(0.1, this.velocitySens)) * velocity
      : velocity;

    const env = this._ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(velGain, now + this.attack);
    env.gain.linearRampToValueAtTime(velGain * this.sustain, now + this.attack + this.decay);

    source.connect(env);
    env.connect(this._filter);
    source.start(now);

    this._active.set(noteNumber, { source, env });
  }

  /* ── Note Off ── */
  noteOff(noteNumber, immediate = false) {
    const a = this._active.get(noteNumber);
    if (!a) return;
    this._active.delete(noteNumber);

    if (!this._ctx) return;
    const now = this._ctx.currentTime;
    const releaseTime = immediate ? 0.02 : this.release;

    a.env.gain.cancelScheduledValues(now);
    a.env.gain.setValueAtTime(a.env.gain.value, now);
    a.env.gain.linearRampToValueAtTime(0, now + releaseTime);

    const stopAt = now + releaseTime + 0.05;
    try { a.source.stop(stopAt); } catch (_) {}
  }

  /* ── All notes off ── */
  allNotesOff() {
    for (const note of [...this._active.keys()]) this.noteOff(note);
  }

  /* ── Parameter setters ── */
  setAttack(v)     { this.attack  = v; }
  setDecay(v)      { this.decay   = v; }
  setSustain(v)    { this.sustain = v; }
  setRelease(v)    { this.release = v; }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (this._masterGain) this._masterGain.gain.setTargetAtTime(v, this._ctx.currentTime, 0.01);
  }

  setFilterType(t) {
    this.filterType = t;
    if (this._filter) this._filter.type = t;
  }
  setFilterFreq(v) {
    this.filterFreq = v;
    if (this._filter) this._filter.frequency.setTargetAtTime(v, this._ctx.currentTime, 0.01);
  }
  setFilterQ(v) {
    this.filterQ = v;
    if (this._filter) this._filter.Q.setTargetAtTime(v, this._ctx.currentTime, 0.01);
  }
  setFilterGain(v) {
    this.filterGain = v;
    if (this._filter) this._filter.gain.setTargetAtTime(v, this._ctx.currentTime, 0.01);
  }

  setEqLow(db)  { this.eqLow  = db; if (this._eqLow)  this._eqLow.gain.setTargetAtTime(db,  this._ctx.currentTime, 0.01); }
  setEqMid(db)  { this.eqMid  = db; if (this._eqMid)  this._eqMid.gain.setTargetAtTime(db,  this._ctx.currentTime, 0.01); }
  setEqHigh(db) { this.eqHigh = db; if (this._eqHigh) this._eqHigh.gain.setTargetAtTime(db, this._ctx.currentTime, 0.01); }

  /* ── Mapping metadata ── */
  setMapping(rootNote, loNote, hiNote) {
    this._loNote.set(rootNote, loNote);
    this._hiNote.set(rootNote, hiNote);
  }
  clearMappingFor(rootNote) {
    this._loNote.delete(rootNote);
    this._hiNote.delete(rootNote);
  }
  getMappings() {
    const out = [];
    for (const [root] of this._samples) {
      out.push({ root, lo: this._loNote.get(root) ?? root, hi: this._hiNote.get(root) ?? root });
    }
    return out;
  }

  /* ── Get current AudioContext time (for recording sync) ── */
  get currentTime() { return this._ctx ? this._ctx.currentTime : 0; }

  /* ── Offline render: replay recorded events and return PCM AudioBuffer ── */
  async renderToBuffer(events, tailSeconds = 3) {
    if (!events.length) return null;
    this._ensureCtx();

    const lastTime = events[events.length - 1].time + tailSeconds;
    const sr = this._ctx.sampleRate;
    const offline = new OfflineAudioContext(2, Math.ceil(sr * lastTime), sr);

    // Build offline gain chain
    const masterGain = offline.createGain();
    masterGain.gain.value = this.masterVolume;

    const filter = offline.createBiquadFilter();
    filter.type = this.filterType;
    filter.frequency.value = this.filterFreq;
    filter.Q.value = this.filterQ;
    filter.gain.value = this.filterGain;

    const eqLow  = offline.createBiquadFilter(); eqLow.type  = 'lowshelf';  eqLow.frequency.value  = 250;  eqLow.gain.value  = this.eqLow;
    const eqMid  = offline.createBiquadFilter(); eqMid.type  = 'peaking';   eqMid.frequency.value  = 1000; eqMid.gain.value  = this.eqMid;  eqMid.Q.value = 1;
    const eqHigh = offline.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 4000; eqHigh.gain.value = this.eqHigh;

    filter.connect(eqLow); eqLow.connect(eqMid); eqMid.connect(eqHigh);
    eqHigh.connect(masterGain); masterGain.connect(offline.destination);

    // Schedule notes
    const activeInOffline = new Map();

    const scheduleOn = (noteNumber, velocity, time) => {
      const found = this._findBuffer(noteNumber);
      if (!found) return;
      const { buffers, rootNote } = found;
      const buffer = buffers[0]; // no round-robin in render

      const src = offline.createBufferSource();
      src.buffer = buffer;
      const semitones = (noteNumber - rootNote) + this.pitchCoarse + (this.pitchFine / 100);
      src.playbackRate.value = Math.pow(2, semitones / 12);

      const velGain = Math.pow(velocity, 1 / Math.max(0.1, this.velocitySens)) * velocity;
      const env = offline.createGain();
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(velGain, time + this.attack);
      env.gain.linearRampToValueAtTime(velGain * this.sustain, time + this.attack + this.decay);

      src.connect(env); env.connect(filter);
      src.start(time);
      activeInOffline.set(noteNumber, { src, env, velGain });
    };

    const scheduleOff = (noteNumber, time) => {
      const a = activeInOffline.get(noteNumber);
      if (!a) return;
      activeInOffline.delete(noteNumber);
      a.env.gain.setValueAtTime(a.velGain * this.sustain, time);
      a.env.gain.linearRampToValueAtTime(0, time + this.release);
      try { a.src.stop(time + this.release + 0.05); } catch (_) {}
    };

    for (const ev of events) {
      if (ev.type === 'noteOn')  scheduleOn(ev.note,  ev.velocity, ev.time);
      if (ev.type === 'noteOff') scheduleOff(ev.note, ev.time);
    }

    return offline.startRendering();
  }

  /* ── Export AudioBuffer → WAV ArrayBuffer ── */
  static audioBufferToWav(buffer) {
    const nCh = buffer.numberOfChannels;
    const sr   = buffer.sampleRate;
    const len  = buffer.length;
    const data = new DataView(new ArrayBuffer(44 + len * nCh * 2));

    const s = (off, str) => { for (let i = 0; i < str.length; i++) data.setUint8(off + i, str.charCodeAt(i)); };
    s(0,'RIFF'); data.setUint32(4, 36 + len * nCh * 2, true);
    s(8,'WAVE'); s(12,'fmt ');
    data.setUint32(16, 16, true);
    data.setUint16(20, 1, true);
    data.setUint16(22, nCh, true);
    data.setUint32(24, sr, true);
    data.setUint32(28, sr * nCh * 2, true);
    data.setUint16(32, nCh * 2, true);
    data.setUint16(34, 16, true);
    s(36,'data'); data.setUint32(40, len * nCh * 2, true);

    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let ch = 0; ch < nCh; ch++) {
        const v = buffer.getChannelData(ch)[i];
        const s16 = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
        data.setInt16(off, s16, true);
        off += 2;
      }
    }
    return data.buffer;
  }
}
