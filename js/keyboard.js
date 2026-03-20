/**
 * keyboard.js
 * Renders an 88-key piano keyboard (MIDI notes 21–108).
 * Supports mouse, touch, and computer-keyboard input.
 * Emits 'noteOn' and 'noteOff' CustomEvents on the keyboard container.
 */

const MIDI_LO = 21;  // A0
const MIDI_HI = 108; // C8

// Semitone positions within an octave — 0=C … 11=B
// true = black key
const BLACK_KEY = [false, true, false, true, false, false, true, false, true, false, true, false];

// Keyboard-to-MIDI shortcut mapping (home row = C4 area)
const KB_MAP = {
  'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
  't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71,
  'k': 72, 'o': 73, 'l': 74, 'p': 75, ';': 76,
};

/**
 * @param {HTMLElement} container - #keyboard element
 */
export function buildKeyboard(container) {
  container.innerHTML = '';

  // We lay out white keys as block elements, then absolutely position black keys
  // relative to their preceding white key.
  let whiteIndex = 0; // pixel offset in white-key widths (32px each)

  for (let midi = MIDI_LO; midi <= MIDI_HI; midi++) {
    const semitone = midi % 12;
    const isBlack  = BLACK_KEY[semitone];
    const noteName = midiToName(midi);
    const key = document.createElement('div');

    if (isBlack) {
      key.className = 'key-black';
      // Position black key: offset from left edge of keyboard
      // Each white key is 32px wide. Black key sits 12px from the left of the white key before it.
      key.style.left = `${whiteIndex * 32 - 11}px`;
      key.setAttribute('aria-label', `${noteName} (MIDI ${midi})`);
    } else {
      key.className = 'key-white';
      // Show note name label only for C notes
      if (semitone === 0) {
        const label = document.createElement('span');
        label.textContent = noteName;
        label.setAttribute('aria-hidden', 'true');
        key.appendChild(label);
      }
      whiteIndex++;
      key.setAttribute('aria-label', `${noteName} (MIDI ${midi})`);
    }

    key.dataset.midi   = String(midi);
    key.dataset.note   = noteName;
    key.setAttribute('role', 'button');
    key.setAttribute('tabindex', '0');
    container.appendChild(key);
  }

  // Set keyboard container width so it scrolls properly
  const whiteCount = Array.from({ length: MIDI_HI - MIDI_LO + 1 }, (_, i) => i + MIDI_LO)
    .filter(n => !BLACK_KEY[n % 12]).length;
  container.style.width = `${whiteCount * 32}px`;

  _attachEvents(container);
}

/**
 * Mark a key as having a sample assigned.
 * @param {HTMLElement} container
 * @param {number}      midi
 * @param {boolean}     hasSample
 */
export function markKeySample(container, midi, hasSample) {
  const key = container.querySelector(`[data-midi="${midi}"]`);
  if (!key) return;
  key.classList.toggle('has-sample', hasSample);
}

/**
 * Highlight a key as active (playing).
 * @param {HTMLElement} container
 * @param {number}      midi
 * @param {boolean}     active
 */
export function setKeyActive(container, midi, active) {
  const key = container.querySelector(`[data-midi="${midi}"]`);
  if (!key) return;
  key.classList.toggle('active', active);
}

/* ------------------------------------------------------------------ */
/* Event wiring                                                          */
/* ------------------------------------------------------------------ */

function _attachEvents(container) {
  // --- Mouse ---
  container.addEventListener('mousedown', (e) => {
    const key = e.target.closest('[data-midi]');
    if (!key) return;
    e.preventDefault();
    _triggerNoteOn(container, Number(key.dataset.midi));
  });

  container.addEventListener('mouseup', (e) => {
    const key = e.target.closest('[data-midi]');
    if (!key) return;
    _triggerNoteOff(container, Number(key.dataset.midi));
  });

  // Handle mouse-leaving a key while button held (glide)
  container.addEventListener('mouseleave', () => {
    _clearAllActive(container);
  });

  container.addEventListener('mouseover', (e) => {
    if (e.buttons !== 1) return;
    const key = e.target.closest('[data-midi]');
    if (!key) return;
    _triggerNoteOn(container, Number(key.dataset.midi));
  });

  container.addEventListener('mouseout', (e) => {
    if (e.buttons !== 1) return;
    const key = e.target.closest('[data-midi]');
    if (!key) return;
    _triggerNoteOff(container, Number(key.dataset.midi));
  });

  // --- Touch ---
  container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const key = el && el.closest('[data-midi]');
      if (key) _triggerNoteOn(container, Number(key.dataset.midi));
    }
  }, { passive: false });

  container.addEventListener('touchend', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const key = el && el.closest('[data-midi]');
      if (key) _triggerNoteOff(container, Number(key.dataset.midi));
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    // For each active touch, check if it moved to a different key
    for (const touch of e.changedTouches) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const key = el && el.closest('[data-midi]');
      if (key) {
        const midi = Number(key.dataset.midi);
        if (!key.classList.contains('active')) {
          // Release all, play new — simple glide
          _clearAllActive(container);
          _triggerNoteOn(container, midi);
        }
      }
    }
  }, { passive: false });

  // --- Keyboard (delegated to document so keyboard works even when
  //     focus is not on the piano element) ---
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const midi = KB_MAP[e.key.toLowerCase()];
    if (midi !== undefined) {
      e.preventDefault();
      _triggerNoteOn(container, midi);
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const midi = KB_MAP[e.key.toLowerCase()];
    if (midi !== undefined) {
      _triggerNoteOff(container, midi);
    }
  });

  // --- Accessibility: space/enter on focused key ---
  container.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const key = e.target.closest('[data-midi]');
      if (!key) return;
      e.preventDefault();
      _triggerNoteOn(container, Number(key.dataset.midi));
    }
  });

  container.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const key = e.target.closest('[data-midi]');
      if (!key) return;
      _triggerNoteOff(container, Number(key.dataset.midi));
    }
  });
}

function _triggerNoteOn(container, midi) {
  setKeyActive(container, midi, true);
  container.dispatchEvent(new CustomEvent('noteOn', {
    bubbles: true,
    detail: { midi, velocity: 0.8 },
  }));
}

function _triggerNoteOff(container, midi) {
  setKeyActive(container, midi, false);
  container.dispatchEvent(new CustomEvent('noteOff', {
    bubbles: true,
    detail: { midi },
  }));
}

function _clearAllActive(container) {
  container.querySelectorAll('.active').forEach((k) => {
    k.classList.remove('active');
    container.dispatchEvent(new CustomEvent('noteOff', {
      bubbles: true,
      detail: { midi: Number(k.dataset.midi) },
    }));
  });
}

/* ------------------------------------------------------------------ */
/* Utilities                                                             */
/* ------------------------------------------------------------------ */

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

/**
 * Convert a MIDI note number to a human-readable name.
 * @param {number} midi
 * @returns {string}  e.g. "A4", "C#5"
 */
export function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const name   = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

/**
 * Convert a note name to MIDI number.
 * @param {string} name  e.g. "A4"
 * @returns {number}
 */
export function nameToMidi(name) {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return -1;
  const noteIdx = NOTE_NAMES.indexOf(match[1]);
  if (noteIdx === -1) return -1;
  return (parseInt(match[2], 10) + 1) * 12 + noteIdx;
}
