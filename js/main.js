/**
 * main.js
 * Application entry point — wires all modules together.
 */

import { AudioEngine }   from './audioEngine.js';
import { buildKeyboard, setKeyActive } from './keyboard.js';
import { SampleManager } from './sampleManager.js';
import { initControls }  from './controls.js';
import { Recorder }      from './recorder.js';
import { PresetManager } from './presetManager.js';
import { exportInstrumentForDaw } from './dawExport.js';

/* ------------------------------------------------------------------ */
/* Boot                                                                   */
/* ------------------------------------------------------------------ */

const engine = new AudioEngine();

/* --- Keyboard --- */
const keyboardEl = document.getElementById('keyboard');
buildKeyboard(keyboardEl);

/* --- Sample Manager --- */
const sampleManager = new SampleManager({
  dropZone:    document.getElementById('drop-zone'),
  sampleList:  document.getElementById('sample-list'),
  mappingGrid: document.getElementById('mapping-grid'),
  keyboardEl,
  fileInput:   document.getElementById('file-import-wav'),
  batchBtn:    document.getElementById('btn-batch-import'),
  onSampleAdded: async (entry) => {
    try {
      await engine.loadSample(entry.buffer, entry.rootNote, entry.loNote, entry.hiNote);
    } catch (err) {
      console.error('Failed to decode sample:', err);
      showToast(`Failed to load "${entry.name}": ${err.message}`, true);
    }
  },
  onSampleRemoved: (entry) => {
    engine.removeSample(entry.rootNote);
  },
});

/* --- Controls --- */
initControls((param, value) => {
  switch (param) {
    case 'attack':      engine.setAttack(value);               break;
    case 'decay':       engine.setDecay(value);                break;
    case 'sustain':     engine.setSustain(value);              break;
    case 'release':     engine.setRelease(value);              break;
    case 'filterFreq':  engine.setFilterFreq(value);           break;
    case 'filterRes':   engine.setFilterRes(value);            break;
    case 'filterType':  engine.setFilterType(String(value));   break;
    case 'eqLow':       engine.setEqLow(value);                break;
    case 'eqMid':       engine.setEqMid(value);                break;
    case 'eqHigh':      engine.setEqHigh(value);               break;
    case 'pitch':       engine.setPitch(value);                break;
    case 'velocity':    engine.setVelocitySensitivity(value);  break;
    case 'volume':      engine.setVolume(value);               break;
    case 'roundRobin':  engine.setRoundRobin(Boolean(value));  break;
    default: break;
  }
});

/* --- Recorder --- */
const recorder = new Recorder({
  btnRecord:   document.getElementById('btn-record'),
  btnStop:     document.getElementById('btn-stop'),
  btnPlay:     document.getElementById('btn-play'),
  btnExport:   document.getElementById('btn-export-wav'),
  statusEl:    document.getElementById('recorder-status'),
  vuCanvas:    document.getElementById('vu-canvas'),
  audioEngine: engine,
});

/* --- Preset Manager --- */
let _presetName = 'Untitled Instrument';
const presetNameDisplay = document.getElementById('preset-name-display');

const presetManager = new PresetManager({
  audioEngine:   engine,
  sampleManager,
  getPresetName: () => _presetName,
  setPresetName: (name) => {
    _presetName = name;
    presetNameDisplay.textContent = name;
    document.title = `${name} — Snowflake Instrument Studio`;
  },
  getImageSrc: () => {
    const img = document.getElementById('instrument-image');
    return img ? img.src : '';
  },
  setImageSrc: (src) => {
    const img = document.getElementById('instrument-image');
    if (img) img.src = src;
  },
});

/* ------------------------------------------------------------------ */
/* Piano keyboard events → audio engine                                  */
/* ------------------------------------------------------------------ */

document.addEventListener('noteOn', (e) => {
  const { midi, velocity } = e.detail;
  engine.noteOn(midi, velocity).catch(err => console.error('noteOn error:', err));
  recorder.recordNoteOn(midi, velocity);
  setKeyActive(keyboardEl, midi, true);
});

document.addEventListener('noteOff', (e) => {
  const { midi } = e.detail;
  engine.noteOff(midi);
  recorder.recordNoteOff(midi);
  setKeyActive(keyboardEl, midi, false);
});

/* ------------------------------------------------------------------ */
/* Header button handlers                                               */
/* ------------------------------------------------------------------ */

document.getElementById('btn-new').addEventListener('click', () => {
  if (confirm('Start a new instrument? Unsaved changes will be lost.')) {
    presetManager.newPreset();
    showToast('New instrument created.');
  }
});

document.getElementById('btn-open').addEventListener('click', () => {
  document.getElementById('file-open-preset').click();
});

document.getElementById('file-open-preset').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const buf = await _readFileAsArrayBuffer(file);
    await presetManager.load(buf);
    showToast(`Loaded "${_presetName}"`);
  } catch (err) {
    console.error('Preset load error:', err);
    showToast(`Failed to load preset: ${err.message}`, true);
  }
  e.target.value = '';
});

document.getElementById('btn-save').addEventListener('click', async () => {
  try {
    await presetManager.save();
    showToast('Preset saved.');
  } catch (err) {
    console.error('Save error:', err);
    showToast('Failed to save preset.', true);
  }
});

document.getElementById('btn-export').addEventListener('click', async () => {
  try {
    await exportInstrumentForDaw(_presetName, sampleManager.samples);
    showToast('Exported ZIP with WAV files.');
  } catch (err) {
    console.error('DAW export error:', err);
    showToast(err.message || 'DAW export failed.', true);
  }
});

document.getElementById('btn-share').addEventListener('click', async () => {
  try {
    const url = await presetManager.share();
    showToast('Share URL copied to clipboard!');
    console.info('Share URL:', url);
  } catch (err) {
    console.error('Share error:', err);
    showToast('Could not copy share URL.', true);
  }
});

/* Rename */
document.getElementById('btn-rename').addEventListener('click', () => {
  _showRenameModal();
});

/* Instrument image */
document.getElementById('btn-set-image').addEventListener('click', () => {
  document.getElementById('file-set-image').click();
});

document.getElementById('file-set-image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = document.getElementById('instrument-image');
    img.src = String(reader.result);
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

/* ------------------------------------------------------------------ */
/* Rename modal                                                          */
/* ------------------------------------------------------------------ */

function _showRenameModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', 'Rename instrument');

  const modal = document.createElement('div');
  modal.className = 'modal';

  const heading = document.createElement('h2');
  heading.textContent = 'Rename Instrument';

  const input = document.createElement('input');
  input.type  = 'text';
  input.maxLength = 80;
  input.value = _presetName;
  input.setAttribute('aria-label', 'Instrument name');
  // Sanitize on input to avoid XSS if content is ever used in innerHTML elsewhere
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[<>"'&]/g, '');
  });

  const btns = document.createElement('div');
  btns.className = 'modal-btns';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => backdrop.remove());

  const okBtn = document.createElement('button');
  okBtn.textContent = 'Rename';
  okBtn.className   = 'primary';
  okBtn.addEventListener('click', () => {
    const newName = input.value.trim();
    if (newName) {
      presetManager.setPresetName(newName);
    }
    backdrop.remove();
  });

  btns.appendChild(cancelBtn);
  btns.appendChild(okBtn);
  modal.appendChild(heading);
  modal.appendChild(input);
  modal.appendChild(btns);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Trap focus inside modal
  input.focus();
  input.select();

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  // Close on Escape
  backdrop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') backdrop.remove();
  });
}

/* ------------------------------------------------------------------ */
/* Toast notifications                                                  */
/* ------------------------------------------------------------------ */

let _toastContainer = null;

function showToast(message, isError = false) {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toast-container';
    document.body.appendChild(_toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = isError ? 'toast error' : 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  _toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

/**
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
function _readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(/** @type {ArrayBuffer} */ (reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/* ------------------------------------------------------------------ */
/* Load preset from URL on startup                                      */
/* ------------------------------------------------------------------ */

presetManager.loadFromUrl().catch(err => console.warn('URL preset load failed:', err));
