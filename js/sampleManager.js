/**
 * sampleManager.js
 * Handles WAV file import (drag-and-drop + batch), list rendering,
 * key-range assignment, and the mapping grid.
 */

import { midiToName, markKeySample } from './keyboard.js';

const MIDI_LO = 21;
const MIDI_HI = 108;

/**
 * A single imported sample entry.
 * @typedef {Object} SampleEntry
 * @property {string}      id        - unique ID
 * @property {string}      name      - display name (filename without extension)
 * @property {ArrayBuffer} buffer    - raw WAV bytes
 * @property {number}      rootNote  - MIDI root note
 * @property {number}      loNote    - MIDI range low
 * @property {number}      hiNote    - MIDI range high
 */

export class SampleManager {
  /**
   * @param {{
   *   dropZone:       HTMLElement,
   *   sampleList:     HTMLUListElement,
   *   mappingGrid:    HTMLElement,
   *   keyboardEl:     HTMLElement,
   *   fileInput:      HTMLInputElement,
   *   batchBtn:       HTMLButtonElement,
   *   onSampleAdded:  (entry: SampleEntry) => void,
    *   onSampleRemoved:(entry: SampleEntry) => void,
   * }} opts
   */
  constructor(opts) {
    this._dropZone    = opts.dropZone;
    this._listEl      = opts.sampleList;
    this._gridEl      = opts.mappingGrid;
    this._keyboardEl  = opts.keyboardEl;
    this._fileInput   = opts.fileInput;
    this._batchBtn    = opts.batchBtn;
    this._onAdded     = opts.onSampleAdded;
    this._onRemoved   = opts.onSampleRemoved;

    /** @type {SampleEntry[]} */
    this.samples = [];
    this._nextRootNote = 60; // auto-assign starts at C4

    this._buildMappingGrid();
    this._attachEvents();
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Export all sample entries as plain data (buffers excluded — returns
   * just metadata for preset saving).
   * @returns {{ id:string, name:string, rootNote:number, loNote:number, hiNote:number }[]}
   */
  getMetadata() {
    return this.samples.map(({ id, name, rootNote, loNote, hiNote }) => ({
      id, name, rootNote, loNote, hiNote,
    }));
  }

  /**
   * Load a sample entry directly (used by preset restore).
   * @param {SampleEntry} entry
   * @param {{ triggerOnAdded?: boolean }} [options]
   */
  addEntry(entry, options = {}) {
    const { triggerOnAdded = true } = options;
    this.samples.push(entry);
    this._renderListItem(entry);
    this._updateMappingGrid();
    this._markKeys(entry, true);
    if (triggerOnAdded) {
      this._onAdded(entry);
    }
  }

  /**
   * Clear all samples.
   */
  clearAll() {
    for (const entry of this.samples) {
      for (let n = entry.loNote; n <= entry.hiNote; n++) {
        markKeySample(this._keyboardEl, n, false);
      }
      this._onRemoved(entry);
    }
    this.samples = [];
    this._listEl.innerHTML = '';
    this._updateMappingGrid();
  }

  /* ------------------------------------------------------------------ */
  /* File ingestion                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Process a FileList, reading each as ArrayBuffer.
   * @param {FileList|File[]} files
   */
  async importFiles(files) {
    const wavFiles = Array.from(files).filter(f =>
      f.type === 'audio/wav' || f.name.toLowerCase().endsWith('.wav')
    );

    for (const file of wavFiles) {
      try {
        const buffer = await this._readFileAsArrayBuffer(file);
        const name   = file.name.replace(/\.wav$/i, '');
        const root   = this._nextRootNote;
        const lo     = Math.max(MIDI_LO, root - 6);
        const hi     = Math.min(MIDI_HI, root + 6);

        const entry = {
          id:       `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name,
          buffer,
          rootNote: root,
          loNote:   lo,
          hiNote:   hi,
        };

        // Advance auto-assign root note for next sample (by a 12th = one octave)
        this._nextRootNote = Math.min(MIDI_HI, this._nextRootNote + 12);

        this.addEntry(entry);
      } catch (err) {
        console.error(`Failed to load sample "${file.name}":`, err);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * @param {SampleEntry} entry
   */
  _renderListItem(entry) {
    const li = document.createElement('li');
    li.dataset.id = entry.id;
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'listitem');
    li.setAttribute('aria-label', `${entry.name}, keys ${midiToName(entry.loNote)}–${midiToName(entry.hiNote)}`);

    const icon = document.createElement('span');
    icon.className = 'sample-icon';
    icon.textContent = '🎵';
    icon.setAttribute('aria-hidden', 'true');

    const nameEl = document.createElement('span');
    nameEl.className = 'sample-name';
    nameEl.textContent = entry.name;

    const rangeEl = document.createElement('span');
    rangeEl.className = 'sample-range';
    rangeEl.textContent = `${midiToName(entry.loNote)}–${midiToName(entry.hiNote)}`;

    const delBtn = document.createElement('button');
    delBtn.className = 'sample-del';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove sample ${entry.name}`);
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeEntry(entry.id);
    });

    li.appendChild(icon);
    li.appendChild(nameEl);
    li.appendChild(rangeEl);
    li.appendChild(delBtn);

    // Click to select / highlight
    li.addEventListener('click', () => {
      this._listEl.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
    });

    this._listEl.appendChild(li);
  }

  /**
   * @param {string} id
   */
  _removeEntry(id) {
    const idx = this.samples.findIndex(s => s.id === id);
    if (idx === -1) return;
    const entry = this.samples[idx];

    // Unmark keys
    this._markKeys(entry, false);

    this.samples.splice(idx, 1);
    this._listEl.querySelector(`[data-id="${id}"]`)?.remove();
    this._updateMappingGrid();
    this._onRemoved(entry);
  }

  /**
   * Mark or unmark keyboard keys for a sample's range.
   * @param {SampleEntry} entry
   * @param {boolean}     hasSample
   */
  _markKeys(entry, hasSample) {
    for (let n = entry.loNote; n <= entry.hiNote; n++) {
      // Only clear if no other sample covers this note
      if (!hasSample) {
        const stillCovered = this.samples.some(
          s => s.id !== entry.id && n >= s.loNote && n <= s.hiNote
        );
        if (stillCovered) continue;
      }
      markKeySample(this._keyboardEl, n, hasSample);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mapping grid                                                          */
  /* ------------------------------------------------------------------ */

  _buildMappingGrid() {
    this._gridEl.innerHTML = '';
    // Build one row per MIDI note (just visible range labels)
    for (let midi = MIDI_LO; midi <= MIDI_HI; midi++) {
      const noteLabel = document.createElement('div');
      noteLabel.className = 'mapping-note';
      noteLabel.textContent = midiToName(midi);
      noteLabel.setAttribute('aria-hidden', 'true');

      const slot = document.createElement('div');
      slot.className = 'mapping-slot';
      slot.dataset.midi = String(midi);
      slot.setAttribute('role', 'gridcell');
      slot.setAttribute('aria-label', `Key ${midiToName(midi)}: unassigned`);
      slot.setAttribute('tabindex', '0');
      slot.textContent = '—';

      this._gridEl.appendChild(noteLabel);
      this._gridEl.appendChild(slot);
    }
  }

  _updateMappingGrid() {
    const slots = this._gridEl.querySelectorAll('.mapping-slot');
    slots.forEach((slot) => {
      const midi = Number(slot.dataset.midi);
      const entry = this.samples.find(s => midi >= s.loNote && midi <= s.hiNote);
      if (entry) {
        slot.textContent = entry.name;
        slot.classList.add('has-sample');
        slot.setAttribute('aria-label', `Key ${midiToName(midi)}: ${entry.name}`);
      } else {
        slot.textContent = '—';
        slot.classList.remove('has-sample');
        slot.setAttribute('aria-label', `Key ${midiToName(midi)}: unassigned`);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                                */
  /* ------------------------------------------------------------------ */

  _attachEvents() {
    const dz = this._dropZone;

    // Drag-and-drop
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      dz.classList.add('drag-over');
    });

    dz.addEventListener('dragleave', () => {
      dz.classList.remove('drag-over');
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this.importFiles(e.dataTransfer.files);
      }
    });

    // Click to open file dialog
    dz.addEventListener('click', () => this._fileInput.click());
    dz.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._fileInput.click();
      }
    });

    // Batch import button
    this._batchBtn.addEventListener('click', () => this._fileInput.click());

    // File input change
    this._fileInput.addEventListener('change', () => {
      if (this._fileInput.files.length > 0) {
        this.importFiles(this._fileInput.files);
        // Reset so the same files can be re-imported if needed
        this._fileInput.value = '';
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * @param {File} file
   * @returns {Promise<ArrayBuffer>}
   */
  _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(/** @type {ArrayBuffer} */ (reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
}
