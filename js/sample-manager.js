/**
 * SampleManager — Loads WAV files, maintains sample list,
 * handles key-range mapping, and batches import / auto-map.
 */
class SampleManager {
  /**
   * @param {AudioEngine} audioEngine
   * @param {Function} onSamplesChanged  — called whenever the sample list changes
   */
  constructor(audioEngine, onSamplesChanged) {
    this._engine    = audioEngine;
    this._onChange  = onSamplesChanged || (() => {});
    this._samples   = [];          // [{ id, name, file, arrayBuffer, rootNote, loNote, hiNote }]
    this._nextId    = 1;
    this._selected  = null;        // currently selected sample id
  }

  /* ── Load from File objects ── */
  async loadFiles(files) {
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.wav')) continue;
      await this._loadFile(file);
    }
    this._onChange(this._samples);
  }

  async _loadFile(file) {
    const ab = await file.arrayBuffer();
    const id = this._nextId++;
    // Guess a MIDI root note from the filename
    const rootNote = SampleManager.guessRootNote(file.name);
    const audioBuffer = await this._engine.loadBuffer(ab.slice(0), rootNote);
    this._engine.setMapping(rootNote, rootNote, rootNote); // default: exact key

    const sample = { id, name: file.name.replace(/\.wav$/i, ''), file, arrayBuffer: ab, audioBuffer, rootNote, loNote: rootNote, hiNote: rootNote };
    this._samples.push(sample);
    return sample;
  }

  /* ── Auto-map: distribute samples based on their root notes, filling key ranges at midpoints ── */
  autoMap(startNote = 36) {
    if (!this._samples.length) return;
    const sorted = [...this._samples].sort((a, b) => a.rootNote - b.rootNote);

    // If any samples share the same root note (e.g. no filename hints), spread them evenly
    const hasDuplicates = sorted.some((s, i) => i > 0 && s.rootNote === sorted[i - 1].rootNote);
    if (hasDuplicates) {
      this._engine.clearAll();
      const step = sorted.length > 1
        ? Math.floor((127 - startNote) / (sorted.length - 1))
        : 0;
      sorted.forEach((s, i) => {
        s.rootNote = startNote + i * step;
        this._engine.storeBuffer(s.audioBuffer, s.rootNote);
      });
    }

    // Set key ranges to fill the gaps between adjacent root notes
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const prevRoot = i > 0 ? sorted[i - 1].rootNote : -1;
      const nextRoot = i < sorted.length - 1 ? sorted[i + 1].rootNote : 128;
      s.loNote = (i === 0) ? 0 : Math.floor((prevRoot + s.rootNote) / 2) + 1;
      s.hiNote = (i === sorted.length - 1) ? 127 : Math.floor((s.rootNote + nextRoot) / 2);
      this._engine.setMapping(s.rootNote, s.loNote, s.hiNote);
    }

    this._onChange(this._samples);
  }

  /* ── Apply mapping to a specific sample ── */
  applyMapping(sampleId, rootNote, loNote, hiNote) {
    const s = this._samples.find(x => x.id === sampleId);
    if (!s) return;

    // Remove old buffer registration and register at new root note
    this._engine.clearNote(s.rootNote);

    s.rootNote = rootNote;
    s.loNote   = loNote;
    s.hiNote   = hiNote;

    this._engine.storeBuffer(s.audioBuffer, rootNote);
    this._engine.setMapping(rootNote, loNote, hiNote);

    this._onChange(this._samples);
  }

  /* ── Remove a sample ── */
  removeSample(sampleId) {
    const idx = this._samples.findIndex(x => x.id === sampleId);
    if (idx === -1) return;
    const s = this._samples[idx];
    this._engine.clearNote(s.rootNote);
    this._samples.splice(idx, 1);
    if (this._selected === sampleId) this._selected = null;
    this._onChange(this._samples);
  }

  /* ── Select ── */
  select(sampleId) {
    this._selected = sampleId;
    return this._samples.find(x => x.id === sampleId) || null;
  }

  getSelected() {
    return this._samples.find(x => x.id === this._selected) || null;
  }

  getSamples() { return this._samples; }

  /* ── Clear all ── */
  clear() {
    this._engine.clearAll();
    this._samples = [];
    this._selected = null;
    this._onChange(this._samples);
  }

  /* ── Restore samples from preset (array of { name, arrayBuffer, rootNote, loNote, hiNote }) ── */
  async restoreFromPreset(items) {
    this.clear();
    for (const item of items) {
      const id = this._nextId++;
      const audioBuffer = await this._engine.loadBuffer(item.arrayBuffer.slice(0), item.rootNote);
      this._engine.setMapping(item.rootNote, item.loNote, item.hiNote);
      this._samples.push({ id, name: item.name, arrayBuffer: item.arrayBuffer, audioBuffer, rootNote: item.rootNote, loNote: item.loNote, hiNote: item.hiNote });
    }
    this._onChange(this._samples);
  }

  /* ── Utility: guess MIDI root note from filename ── */
  static guessRootNote(filename) {
    // Try patterns like: "Piano_C4", "kick_A2", "note_60", "C#3", "Bb4" etc.
    const NOTE_RE = /([A-Ga-g](?:#|b)?)\s*(\d)/;
    const NUM_RE  = /\b([0-9]{2,3})\b/;

    const m = filename.match(NOTE_RE);
    if (m) {
      const noteNames = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
      let semi = noteNames[m[1].charAt(0).toUpperCase()] ?? 0;
      if (m[1].includes('#')) semi++;
      if (m[1].toLowerCase().includes('b')) semi--;
      const oct = parseInt(m[2], 10);
      return (oct + 1) * 12 + semi;
    }

    const n = filename.match(NUM_RE);
    if (n) {
      const v = parseInt(n[1], 10);
      if (v >= 21 && v <= 108) return v;
    }

    return 60; // fallback: C4
  }

  /* ── Get all mapped MIDI note numbers ── */
  getMappedNotes() { return this._samples.map(s => s.rootNote); }
  getLoHiRanges()  {
    const ranges = [];
    for (const s of this._samples) {
      for (let n = s.loNote; n <= s.hiNote; n++) ranges.push(n);
    }
    return ranges;
  }
}
