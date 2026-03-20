/**
 * controls.js
 * SVG/Canvas knob renderer and EQ slider controller.
 * Each knob is a <canvas data-param="..."> element.
 */

/**
 * Initialise all knobs and EQ sliders.
 * @param {(param: string, value: number) => void} onChange  Called when any control changes.
 */
export function initControls(onChange) {
  _initKnobs(onChange);
  _initEqSliders(onChange);
  _initFilterType(onChange);
  _initRoundRobin(onChange);
}

/* ------------------------------------------------------------------ */
/* Knobs                                                                 */
/* ------------------------------------------------------------------ */

const MIN_ANGLE = -135; // degrees from 12 o'clock, clockwise
const MAX_ANGLE =  135;

/**
 * @param {(param: string, value: number) => void} onChange
 */
function _initKnobs(onChange) {
  document.querySelectorAll('canvas.knob-canvas').forEach((canvas) => {
    const min    = parseFloat(canvas.dataset.min);
    const max    = parseFloat(canvas.dataset.max);
    const defVal = parseFloat(canvas.dataset.default);
    const param  = canvas.dataset.param;

    // Internal state per knob
    const state = { value: defVal, dragging: false, startY: 0, startValue: defVal };

    // Set canvas physical size
    canvas.width  = 48;
    canvas.height = 48;

    _drawKnob(canvas, defVal, min, max);

    // ---- Pointer drag (mouse + touch via pointer events) ----
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      state.dragging   = true;
      state.startY     = e.clientY;
      state.startValue = state.value;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!state.dragging) return;
      const delta = (state.startY - e.clientY) / 150; // px → normalised
      const range = max - min;
      const newVal = Math.min(max, Math.max(min, state.startValue + delta * range));
      state.value = newVal;
      _drawKnob(canvas, newVal, min, max);
      _updateAria(canvas, newVal);
      onChange(param, newVal);
    });

    canvas.addEventListener('pointerup', () => {
      state.dragging = false;
    });

    canvas.addEventListener('pointercancel', () => {
      state.dragging = false;
    });

    // ---- Double-click to reset ----
    canvas.addEventListener('dblclick', () => {
      state.value = defVal;
      _drawKnob(canvas, defVal, min, max);
      _updateAria(canvas, defVal);
      onChange(param, defVal);
    });

    // ---- Scroll wheel ----
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step  = (max - min) / 100;
      const delta = e.deltaY < 0 ? step : -step;
      state.value = Math.min(max, Math.max(min, state.value + delta));
      _drawKnob(canvas, state.value, min, max);
      _updateAria(canvas, state.value);
      onChange(param, state.value);
    }, { passive: false });

    // ---- Keyboard (arrow keys for accessibility) ----
    canvas.addEventListener('keydown', (e) => {
      const step = (max - min) / 100;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        state.value = Math.min(max, state.value + step);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        state.value = Math.max(min, state.value - step);
      } else {
        return;
      }
      _drawKnob(canvas, state.value, min, max);
      _updateAria(canvas, state.value);
      onChange(param, state.value);
    });

    // Expose setter for programmatic value updates
    canvas._setValue = (val) => {
      state.value = Math.min(max, Math.max(min, val));
      _drawKnob(canvas, state.value, min, max);
      _updateAria(canvas, state.value);
    };
  });
}

/**
 * Draw a knob on a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function _drawKnob(canvas, value, min, max) {
  const ctx  = canvas.getContext('2d');
  const cx   = canvas.width  / 2;
  const cy   = canvas.height / 2;
  const r    = (canvas.width / 2) - 4;
  const norm = (value - min) / (max - min); // 0–1

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Background circle ---
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1d24';
  ctx.fill();
  ctx.strokeStyle = '#2e303c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- Track arc (full range, dimmed) ---
  const startRad = _degToRad(MIN_ANGLE - 90);
  const endRad   = _degToRad(MAX_ANGLE - 90);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, startRad, endRad);
  ctx.strokeStyle = '#3a3c4a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- Value arc ---
  const actualValueRad = startRad + norm * (_degToRad(MAX_ANGLE - MIN_ANGLE));
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, startRad, actualValueRad);
  ctx.strokeStyle = '#5cf0e0';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- Pointer line ---
  const pAngle  = MIN_ANGLE + norm * (MAX_ANGLE - MIN_ANGLE); // degrees
  const pRad    = _degToRad(pAngle - 90);
  const lineLen = r - 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + lineLen * Math.cos(pRad), cy + lineLen * Math.sin(pRad));
  ctx.strokeStyle = '#5cf0e0';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // --- Center dot ---
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#5cf0e0';
  ctx.fill();
}

/** @param {number} deg @returns {number} */
function _degToRad(deg) { return (deg * Math.PI) / 180; }
function _updateAria(canvas, value) {
  canvas.setAttribute('aria-valuenow', String(value.toFixed(3)));
}

/* ------------------------------------------------------------------ */
/* EQ sliders                                                            */
/* ------------------------------------------------------------------ */

function _initEqSliders(onChange) {
  const sliders = [
    { id: 'eq-low',  valId: 'eq-low-val',  param: 'eqLow'  },
    { id: 'eq-mid',  valId: 'eq-mid-val',  param: 'eqMid'  },
    { id: 'eq-high', valId: 'eq-high-val', param: 'eqHigh' },
  ];

  sliders.forEach(({ id, valId, param }) => {
    const slider = document.getElementById(id);
    const valEl  = document.getElementById(valId);
    if (!slider || !valEl) return;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      valEl.textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)} dB`;
      slider.setAttribute('aria-valuenow', String(val));
      onChange(param, val);
    });

    // Expose programmatic setter
    slider._setValue = (val) => {
      const clamped = Math.min(12, Math.max(-12, val));
      slider.value = String(clamped);
      valEl.textContent = `${clamped >= 0 ? '+' : ''}${clamped.toFixed(1)} dB`;
      slider.setAttribute('aria-valuenow', String(clamped));
    };
  });
}

/* ------------------------------------------------------------------ */
/* Filter type select                                                    */
/* ------------------------------------------------------------------ */

function _initFilterType(onChange) {
  const sel = document.getElementById('filter-type');
  if (!sel) return;
  sel.addEventListener('change', () => onChange('filterType', sel.value));
}

/* ------------------------------------------------------------------ */
/* Round-robin checkbox                                                  */
/* ------------------------------------------------------------------ */

function _initRoundRobin(onChange) {
  const chk = document.getElementById('chk-round-robin');
  if (!chk) return;
  chk.addEventListener('change', () => onChange('roundRobin', chk.checked));
}

/* ------------------------------------------------------------------ */
/* Public: restore a knob/slider value programmatically                 */
/* ------------------------------------------------------------------ */

/**
 * Set a control's displayed value without triggering onChange.
 * @param {string} param
 * @param {number|string|boolean} value
 */
export function setControlValue(param, value) {
  // Knob canvas
  const canvas = document.querySelector(`canvas.knob-canvas[data-param="${param}"]`);
  if (canvas && canvas._setValue) {
    canvas._setValue(Number(value));
    return;
  }

  // EQ sliders
  if (param === 'eqLow' || param === 'eqMid' || param === 'eqHigh') {
    const idMap = { eqLow: 'eq-low', eqMid: 'eq-mid', eqHigh: 'eq-high' };
    const slider = document.getElementById(idMap[param]);
    if (slider && slider._setValue) {
      slider._setValue(Number(value));
    }
    return;
  }

  // Filter type
  if (param === 'filterType') {
    const sel = document.getElementById('filter-type');
    if (sel) sel.value = String(value);
    return;
  }

  // Round robin
  if (param === 'roundRobin') {
    const chk = document.getElementById('chk-round-robin');
    if (chk) chk.checked = Boolean(value);
  }
}
