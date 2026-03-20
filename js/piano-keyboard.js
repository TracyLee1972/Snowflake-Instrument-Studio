/**
 * PianoKeyboard — Renders a scrollable piano keyboard and dispatches note events.
 * Supports: mouse, touch, and computer-keyboard input.
 * Visually highlights mapped keys and root notes.
 */
class PianoKeyboard {
  /**
   * @param {HTMLElement} container
   * @param {{ onNoteOn: Function, onNoteOff: Function }} callbacks
   */
  constructor(container, callbacks = {}) {
    this.container   = container;
    this.onNoteOn    = callbacks.onNoteOn  || (() => {});
    this.onNoteOff   = callbacks.onNoteOff || (() => {});

    this.startOctave = 1;   // C1
    this.endOctave   = 7;   // B7 (C8 terminal key)
    this.viewOctave  = 3;   // Keyboard starts displaying from this octave

    this._pressedKeys  = new Set();  // MIDI note numbers currently sounding
    this._mappedNotes  = new Set();  // MIDI notes that have a sample mapped
    this._rootNotes    = new Set();  // MIDI notes that are root notes
    this._keyElements  = new Map();  // MIDI note -> DOM element

    this._mouseDown = false;
    this._sustainOn = false;
    this._sustainedNotes = new Set();

    // Computer keyboard mapping (relative to current baseNote)
    // White keys: a s d f g h j k l ; '
    // Black keys: w e t y u o p
    this._KB_WHITE = ['a','s','d','f','g','h','j','k','l',';',"'"];
    this._KB_BLACK = ['w','e','t','y','u','o','p'];
    // White-key offsets: C D E F G A B C D E F (relative semitones)
    this._WHITE_SEMI = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17];
    // Black-key offsets for all 7 keys: C# D# F# G# A# C# D# (spans into next octave)
    this._BLACK_SEMI = [1, 3, 6, 8, 10, 13, 15];

    this._kbBaseNote = 48; // C3 — shifts with octave controls

    this._build();
    this._attachMouseEvents();
    this._attachKeyboardEvents();
    this._attachTouchEvents();
  }

  /* ─── Build DOM ─── */
  _build() {
    this.container.innerHTML = '';
    this._keyElements.clear();

    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    // Black key offsets within a single octave (30px white-key width = 210px per octave)
    // C#:21, D#:51, F#:111, G#:141, A#:171
    const BLACK_OFFSETS = [21, 51, 111, 141, 171];

    for (let oct = this.startOctave; oct <= this.endOctave; oct++) {
      const octaveDiv = document.createElement('div');
      octaveDiv.className = 'piano-octave';
      octaveDiv.style.position = 'relative';
      octaveDiv.style.display  = 'inline-block';
      octaveDiv.style.width    = '210px'; // 7 × 30px

      for (let semi = 0; semi < 12; semi++) {
        const midi = (oct + 1) * 12 + semi; // MIDI: octave+1 because C4=60=(4+1)*12
        const name = NOTE_NAMES[semi];
        const isBlack = name.includes('#');
        const key = document.createElement('div');

        if (!isBlack) {
          key.className = 'key-white';
          const label = document.createElement('span');
          label.className = 'key-label';
          if (semi === 0) label.textContent = `C${oct}`; // label C keys
          key.appendChild(label);
          key.style.display = 'inline-block';
          octaveDiv.appendChild(key);
        } else {
          key.className = 'key-black';
          // Find position among black keys in octave
          const blackIdx = [1,3,6,8,10].indexOf(semi);
          if (blackIdx !== -1) {
            key.style.left = BLACK_OFFSETS[blackIdx] + 'px';
            key.style.top  = '0';
          }
          octaveDiv.appendChild(key);
        }

        key.dataset.midi = midi;
        key.dataset.note = name + oct;
        this._keyElements.set(midi, key);

        // Mouse down on key
        key.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._mouseDown = true;
          this._triggerOn(midi, 0.8);
        });
        key.addEventListener('mouseup', () => {
          this._mouseDown = false;
          this._triggerOff(midi);
        });
        key.addEventListener('mouseenter', (e) => {
          if (this._mouseDown) this._triggerOn(midi, 0.8);
        });
        key.addEventListener('mouseleave', () => {
          if (this._mouseDown) this._triggerOff(midi);
        });
      }

      this.container.appendChild(octaveDiv);
    }

    // Add final C key (C8 = midi 108)
    const finalC = document.createElement('div');
    finalC.className = 'key-white';
    finalC.dataset.midi = 108;
    finalC.dataset.note = 'C8';
    const lbl = document.createElement('span');
    lbl.className = 'key-label'; lbl.textContent = 'C8';
    finalC.appendChild(lbl);
    finalC.style.display = 'inline-block';
    finalC.addEventListener('mousedown', (e) => { e.preventDefault(); this._mouseDown = true; this._triggerOn(108, 0.8); });
    finalC.addEventListener('mouseup',   () => { this._mouseDown = false; this._triggerOff(108); });
    this._keyElements.set(108, finalC);

    const lastOctave = document.createElement('div');
    lastOctave.style.position = 'relative';
    lastOctave.style.display  = 'inline-block';
    lastOctave.appendChild(finalC);
    this.container.appendChild(lastOctave);

    this._refreshVisuals();
    this.scrollToOctave(this.viewOctave);
  }

  /* ─── Scroll viewport to make an octave visible ─── */
  scrollToOctave(oct) {
    const wrapper = this.container.parentElement;
    if (!wrapper) return;
    const whiteKeyWidth = 30;
    const whitesBeforeOct = (oct - this.startOctave) * 7;
    wrapper.scrollLeft = whitesBeforeOct * whiteKeyWidth - 10;
  }

  shiftOctave(delta) {
    this.viewOctave = Math.max(this.startOctave, Math.min(this.endOctave, this.viewOctave + delta));
    this._kbBaseNote = (this.viewOctave + 1) * 12; // C of that octave
    this.scrollToOctave(this.viewOctave);
    return this.viewOctave;
  }

  /* ─── Mark which keys have samples mapped ─── */
  setMappedNotes(notes)  { this._mappedNotes = new Set(notes); this._refreshVisuals(); }
  setRootNotes(notes)    { this._rootNotes   = new Set(notes); this._refreshVisuals(); }

  _refreshVisuals() {
    for (const [midi, el] of this._keyElements) {
      const isBlack  = el.classList.contains('key-black');
      const isMapped = this._mappedNotes.has(midi);
      const isRoot   = this._rootNotes.has(midi);
      const isActive = this._pressedKeys.has(midi);

      el.classList.toggle('mapped', isMapped && !isRoot);
      el.classList.toggle('root',   isRoot);
      el.classList.toggle('active', isActive);
    }
  }

  /* ─── Note trigger helpers ─── */
  _triggerOn(midi, velocity) {
    if (this._pressedKeys.has(midi)) return;
    this._pressedKeys.add(midi);
    const el = this._keyElements.get(midi);
    if (el) el.classList.add('active');
    this.onNoteOn(midi, velocity);
  }

  _triggerOff(midi) {
    if (!this._pressedKeys.has(midi)) return;
    this._pressedKeys.delete(midi);
    if (this._sustainOn) {
      this._sustainedNotes.add(midi);
      return;
    }
    const el = this._keyElements.get(midi);
    if (el) el.classList.remove('active');
    this.onNoteOff(midi);
  }

  setSustain(on) {
    this._sustainOn = on;
    if (!on) {
      for (const midi of this._sustainedNotes) {
        const el = this._keyElements.get(midi);
        if (el) el.classList.remove('active');
        this.onNoteOff(midi);
      }
      this._sustainedNotes.clear();
    }
  }

  /* ─── Mouse global up (end drag-play) ─── */
  _attachMouseEvents() {
    document.addEventListener('mouseup', () => {
      if (this._mouseDown) {
        this._mouseDown = false;
        for (const m of [...this._pressedKeys]) this._triggerOff(m);
      }
    });
  }

  /* ─── Touch events ─── */
  _attachTouchEvents() {
    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.dataset.midi) this._triggerOn(+el.dataset.midi, 0.8);
      }
    }, { passive: false });

    const handleTouchRelease = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.dataset.midi) this._triggerOff(+el.dataset.midi);
      }
    };

    this.container.addEventListener('touchend',    handleTouchRelease, { passive: false });

    // touchcancel fires when e.g. a phone call interrupts; release all pressed keys
    this.container.addEventListener('touchcancel', () => {
      for (const m of [...this._pressedKeys]) this._triggerOff(m);
    }, { passive: false });
  }

  /* ─── Computer keyboard events ─── */
  _attachKeyboardEvents() {
    this._heldKbKeys = new Set();

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.repeat) return;

      const k = e.key.toLowerCase();

      // Octave shift
      if (k === 'z') { this.shiftOctave(-1); return; }
      if (k === 'x') { this.shiftOctave(+1); return; }

      // Sustain via space
      if (k === ' ') { this.setSustain(true); return; }

      const whiteIdx = this._KB_WHITE.indexOf(k);
      const blackIdx = this._KB_BLACK.indexOf(k);

      if (whiteIdx !== -1) {
        const midi = this._kbBaseNote + this._WHITE_SEMI[whiteIdx];
        if (!this._heldKbKeys.has(k)) {
          this._heldKbKeys.add(k);
          this._triggerOn(midi, 0.75);
        }
      } else if (blackIdx !== -1) {
        const midi = this._kbBaseNote + this._BLACK_SEMI[blackIdx];
        if (!this._heldKbKeys.has(k)) {
          this._heldKbKeys.add(k);
          this._triggerOn(midi, 0.75);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();

      if (k === ' ') { this.setSustain(false); return; }

      this._heldKbKeys.delete(k);

      const whiteIdx = this._KB_WHITE.indexOf(k);
      const blackIdx = this._KB_BLACK.indexOf(k);

      if (whiteIdx !== -1) {
        const midi = this._kbBaseNote + this._WHITE_SEMI[whiteIdx];
        this._triggerOff(midi);
      } else if (blackIdx !== -1) {
        const midi = this._kbBaseNote + this._BLACK_SEMI[blackIdx];
        this._triggerOff(midi);
      }
    });
  }

  /* ─── Public: force all notes off ─── */
  allNotesOff() {
    for (const m of [...this._pressedKeys, ...this._sustainedNotes]) {
      const el = this._keyElements.get(m);
      if (el) el.classList.remove('active');
      this.onNoteOff(m);
    }
    this._pressedKeys.clear();
    this._sustainedNotes.clear();
  }
}
