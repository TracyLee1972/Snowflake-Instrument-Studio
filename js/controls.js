/**
 * Controls — Sets up knobs (canvas-based rotary) and sliders,
 * and wires them to AudioEngine parameter updates.
 */

/* ──────────────────────────────────────────
   Rotary Knob (canvas-drawn, drag to turn)
   ────────────────────────────────────────── */
class Knob {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ min, max, value, log, onChange }} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas  = canvas;
    this.min     = opts.min  ?? parseFloat(canvas.dataset.min  ?? '0');
    this.max     = opts.max  ?? parseFloat(canvas.dataset.max  ?? '1');
    this.value   = opts.value ?? parseFloat(canvas.dataset.value ?? '0');
    this.log     = opts.log  ?? (canvas.dataset.log === '1');
    this.onChange = opts.onChange || (() => {});

    this._startY  = 0;
    this._startVal = 0;

    this._draw();
    this._attachEvents();
  }

  setValue(v) {
    this.value = Math.max(this.min, Math.min(this.max, v));
    this._draw();
  }

  /* normalised 0-1 */
  _norm(v) {
    if (this.log) {
      const logMin = Math.log(Math.max(this.min, 0.001));
      const logMax = Math.log(Math.max(this.max, 0.001));
      return (Math.log(Math.max(v, 0.001)) - logMin) / (logMax - logMin);
    }
    return (v - this.min) / (this.max - this.min);
  }
  _fromNorm(n) {
    if (this.log) {
      const logMin = Math.log(Math.max(this.min, 0.001));
      const logMax = Math.log(Math.max(this.max, 0.001));
      return Math.exp(logMin + n * (logMax - logMin));
    }
    return this.min + n * (this.max - this.min);
  }

  _draw() {
    const c = this.canvas;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    const cx = w / 2, cy = h / 2;
    const r  = Math.min(w, h) / 2 - 4;

    ctx.clearRect(0, 0, w, h);

    // Track arc
    const startAngle = Math.PI * 0.75;
    const endAngle   = Math.PI * 2.25;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = '#2a3040';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value arc
    const norm  = this._norm(this.value);
    const angle = startAngle + norm * (endAngle - startAngle);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, angle);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Knob body
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 1, cx, cy, r - 5);
    grad.addColorStop(0, '#3a4050');
    grad.addColorStop(1, '#1a1d25');
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Pointer line
    const px = cx + (r - 8) * Math.cos(angle);
    const py = cy + (r - 8) * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#e0e8ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value text
    ctx.fillStyle = '#7a90b8';
    ctx.font = `bold ${Math.max(7, w * 0.18)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = this._formatValue();
    ctx.fillText(txt, cx, cy + r * 0.15);
  }

  _formatValue() {
    const v = this.value;
    if (this.log && v >= 1000) return (v / 1000).toFixed(1) + 'k';
    if (Math.abs(v) < 10)  return v.toFixed(2);
    if (Math.abs(v) < 100) return v.toFixed(1);
    return Math.round(v).toString();
  }

  _attachEvents() {
    const c = this.canvas;

    const onMove = (e) => {
      const dy = this._startY - (e.clientY ?? e.touches?.[0]?.clientY);
      const sensitivity = 0.004;
      const normDelta = dy * sensitivity;
      const newNorm = Math.max(0, Math.min(1, this._norm(this._startVal) + normDelta));
      this.value = this._fromNorm(newNorm);
      this._draw();
      this.onChange(this.value);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
      c.style.cursor = 'ns-resize';
    };

    c.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._startY   = e.clientY;
      this._startVal = this.value;
      c.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);
    });

    c.addEventListener('touchstart', (e) => {
      this._startY   = e.touches[0].clientY;
      this._startVal = this.value;
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend',  onUp);
    }, { passive: true });

    // Double-click to reset
    c.addEventListener('dblclick', () => {
      const def = parseFloat(c.dataset.value ?? '0');
      this.setValue(def);
      this.onChange(this.value);
    });

    c.style.cursor = 'ns-resize';
  }
}

/* ──────────────────────────────────────────
   Controls module init
   ────────────────────────────────────────── */
function initControls(audioEngine) {
  const knobs = new Map();

  function setupKnob(id, onChange) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const k = new Knob(canvas, { onChange });
    knobs.set(id, k);
    return k;
  }

  function setupSlider(id, displayId, format, onChange) {
    const el = document.getElementById(id);
    const lbl = displayId ? document.getElementById(displayId) : null;
    if (!el) return;
    const update = () => {
      const v = parseFloat(el.value);
      if (lbl) lbl.textContent = format(v);
      onChange(v);
    };
    el.addEventListener('input', update);
    update(); // init display
  }

  /* ── ADSR ── */
  const adsrCanvas = document.getElementById('adsr-canvas');

  function drawADSR() {
    if (!adsrCanvas) return;
    const ctx = adsrCanvas.getContext('2d');
    const w = adsrCanvas.width, h = adsrCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const a = audioEngine.attack;
    const d = audioEngine.decay;
    const s = audioEngine.sustain;
    const r = audioEngine.release;
    const total = Math.max(a + d + 0.3 + r, 0.5);

    const toX = t => 8 + (t / total) * (w - 16);
    const toY = v => (h - 8) - v * (h - 16);

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(a), toY(1));
    ctx.lineTo(toX(a + d), toY(s));
    ctx.lineTo(toX(a + d + 0.3), toY(s));
    ctx.lineTo(toX(a + d + 0.3 + r), toY(0));

    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineTo(toX(0), toY(0));
    ctx.fillStyle = 'rgba(74,158,255,0.12)';
    ctx.fill();
  }

  function sToTime(v) { return (v / 100) * (v / 100) * 5; } // exponential 0–5 s

  setupSlider('adsr-attack',  'adsr-attack-lbl',  v => sToTime(v).toFixed(2) + 's', v => { audioEngine.setAttack(sToTime(v));  drawADSR(); });
  setupSlider('adsr-decay',   'adsr-decay-lbl',   v => sToTime(v).toFixed(2) + 's', v => { audioEngine.setDecay(sToTime(v));   drawADSR(); });
  setupSlider('adsr-sustain', 'adsr-sustain-lbl', v => Math.round(v) + '%',          v => { audioEngine.setSustain(v / 100);    drawADSR(); });
  setupSlider('adsr-release', 'adsr-release-lbl', v => sToTime(v).toFixed(2) + 's', v => { audioEngine.setRelease(sToTime(v)); drawADSR(); });

  drawADSR();

  /* ── Filter ── */
  const filterTypeEl = document.getElementById('filter-type');
  if (filterTypeEl) {
    filterTypeEl.addEventListener('change', () => audioEngine.setFilterType(filterTypeEl.value));
  }

  setupKnob('knob-filter-freq',  v => audioEngine.setFilterFreq(v));
  setupKnob('knob-filter-q',     v => audioEngine.setFilterQ(v));
  setupKnob('knob-filter-gain',  v => audioEngine.setFilterGain(v));

  /* ── EQ ── */
  setupSlider('eq-low',  'eq-low-lbl',  v => (v >= 0 ? '+' : '') + v + 'dB', v => audioEngine.setEqLow(v));
  setupSlider('eq-mid',  'eq-mid-lbl',  v => (v >= 0 ? '+' : '') + v + 'dB', v => audioEngine.setEqMid(v));
  setupSlider('eq-high', 'eq-high-lbl', v => (v >= 0 ? '+' : '') + v + 'dB', v => audioEngine.setEqHigh(v));

  /* ── Volume & Velocity ── */
  setupSlider('master-vol', 'master-vol-lbl', v => Math.round(v) + '%',  v => audioEngine.setMasterVolume(v / 100));
  setupSlider('vel-sens',   'vel-sens-lbl',   v => Math.round(v) + '%',  v => { audioEngine.velocitySens = v / 100; });

  /* ── Pitch ── */
  setupKnob('knob-pitch-coarse', v => { audioEngine.pitchCoarse = Math.round(v); });
  setupKnob('knob-pitch-fine',   v => { audioEngine.pitchFine   = v; });

  /* ── Round Robin ── */
  const rrEnable = document.getElementById('rr-enable');
  if (rrEnable) {
    rrEnable.addEventListener('change', () => { audioEngine.roundRobinEnabled = rrEnable.checked; });
  }
  setupSlider('rr-count', 'rr-count-lbl', v => Math.round(v), () => {});

  return { drawADSR, knobs };
}
