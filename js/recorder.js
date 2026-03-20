/**
 * Recorder — Records note events with timestamps,
 * supports playback, and exports the performance as a WAV file.
 */
class Recorder {
  /**
   * @param {AudioEngine} audioEngine
   * @param {{ onStateChange: Function }} callbacks
   */
  constructor(audioEngine, callbacks = {}) {
    this._engine      = audioEngine;
    this._onStateChange = callbacks.onStateChange || (() => {});

    this.state   = 'idle';   // 'idle' | 'recording' | 'playing'
    this.events  = [];       // [{ type:'noteOn'|'noteOff', note, velocity, time }]
    this._recStart  = 0;
    this._playStart = 0;
    this._playTimers = [];
    this._timerInterval = null;
  }

  /* ── Start recording ── */
  startRecording() {
    if (this.state !== 'idle') return;
    this.events  = [];
    this._recStart = this._engine.currentTime;
    this.state = 'recording';
    this._startTimer();
    this._onStateChange('recording');
  }

  /* ── Stop recording (or stop playback) ── */
  stop() {
    if (this.state === 'idle') return;
    const prev = this.state;
    this.state = 'idle';
    this._stopTimer();

    if (prev === 'playing') {
      for (const t of this._playTimers) clearTimeout(t);
      this._playTimers = [];
      this._engine.allNotesOff();
    }

    this._onStateChange('idle');
  }

  /* ── Record a note-on event ── */
  recordNoteOn(note, velocity) {
    if (this.state !== 'recording') return;
    this.events.push({ type: 'noteOn', note, velocity, time: this._engine.currentTime - this._recStart });
  }

  /* ── Record a note-off event ── */
  recordNoteOff(note) {
    if (this.state !== 'recording') return;
    this.events.push({ type: 'noteOff', note, velocity: 0, time: this._engine.currentTime - this._recStart });
  }

  /* ── Play back recorded events ── */
  playback() {
    if (this.state !== 'idle' || !this.events.length) return;
    this.state = 'playing';
    this._playStart = performance.now();
    this._startTimer();
    this._onStateChange('playing');

    for (const ev of this.events) {
      const delay = ev.time * 1000; // seconds → ms
      const t = setTimeout(() => {
        if (this.state !== 'playing') return;
        if (ev.type === 'noteOn')  this._engine.noteOn(ev.note, ev.velocity);
        if (ev.type === 'noteOff') this._engine.noteOff(ev.note);
      }, delay);
      this._playTimers.push(t);
    }

    // Auto-stop after last event
    const lastTime = this.events[this.events.length - 1].time * 1000;
    const stopTimer = setTimeout(() => this.stop(), lastTime + 1500);
    this._playTimers.push(stopTimer);
  }

  /* ── Export melody as downloadable WAV ── */
  async exportWAV(filename = 'melody.wav') {
    if (!this.events.length) return false;

    const rendered = await this._engine.renderToBuffer(this.events, 3);
    if (!rendered) return false;

    const wav = AudioEngine.audioBufferToWav(rendered);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  }

  /* ── Timer display ── */
  _startTimer() {
    this._timerInterval = setInterval(() => this._onStateChange(this.state), 100);
  }
  _stopTimer() {
    clearInterval(this._timerInterval);
    this._timerInterval = null;
  }

  /* ── Elapsed time string ── */
  getElapsedString() {
    if (this.state === 'recording') {
      const elapsed = this._engine.currentTime - this._recStart;
      return Recorder._formatTime(elapsed);
    }
    if (this.state === 'playing') {
      const elapsed = (performance.now() - this._playStart) / 1000;
      return Recorder._formatTime(elapsed);
    }
    if (this.events.length) {
      const total = this.events[this.events.length - 1].time;
      return Recorder._formatTime(total);
    }
    return '00:00.000';
  }

  static _formatTime(seconds) {
    const m   = Math.floor(seconds / 60);
    const s   = Math.floor(seconds % 60);
    const ms  = Math.floor((seconds % 1) * 1000);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
  }
}
