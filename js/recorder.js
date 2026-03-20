/**
 * recorder.js
 * Records note events as MIDI-like data and encodes a playback WAV via
 * Web Audio API OfflineAudioContext.
 * Also drives the VU meter canvas.
 */

/**
 * @typedef {{ time: number, type: 'noteOn'|'noteOff', midi: number, velocity: number }} NoteEvent
 */

export class Recorder {
  /**
   * @param {{
   *   btnRecord:    HTMLButtonElement,
   *   btnStop:      HTMLButtonElement,
   *   btnPlay:      HTMLButtonElement,
   *   btnExport:    HTMLButtonElement,
   *   statusEl:     HTMLElement,
   *   vuCanvas:     HTMLCanvasElement,
   *   audioEngine:  import('./audioEngine.js').AudioEngine,
   * }} opts
   */
  constructor(opts) {
    this._btnRecord  = opts.btnRecord;
    this._btnStop    = opts.btnStop;
    this._btnPlay    = opts.btnPlay;
    this._btnExport  = opts.btnExport;
    this._statusEl   = opts.statusEl;
    this._vuCanvas   = opts.vuCanvas;
    this._engine     = opts.audioEngine;

    /** @type {NoteEvent[]} */
    this._events = [];
    this._isRecording = false;
    this._recordStart = 0;

    /** @type {MediaStreamAudioDestinationNode|null} */
    this._mediaDestNode = null;
    /** @type {MediaRecorder|null} */
    this._mediaRecorder = null;
    /** @type {Blob[]} */
    this._chunks = [];

    /** @type {AudioBuffer|null} - last exported audio for playback */
    this._recordedBuffer = null;
    /** @type {AudioBufferSourceNode|null} */
    this._playbackSource = null;

    // VU meter
    /** @type {AnalyserNode|null} */
    this._analyser = null;
    this._vuAnimId = null;

    this._attachEvents();
  }

  /* ------------------------------------------------------------------ */
  /* Public: called by main.js on noteOn/noteOff                          */
  /* ------------------------------------------------------------------ */

  /**
   * @param {number} midi
   * @param {number} velocity
   */
  recordNoteOn(midi, velocity) {
    if (!this._isRecording) return;
    this._events.push({
      time:     performance.now() - this._recordStart,
      type:     'noteOn',
      midi,
      velocity,
    });
  }

  /**
   * @param {number} midi
   */
  recordNoteOff(midi) {
    if (!this._isRecording) return;
    this._events.push({
      time:     performance.now() - this._recordStart,
      type:     'noteOff',
      midi,
      velocity: 0,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Internal event wiring                                                 */
  /* ------------------------------------------------------------------ */

  _attachEvents() {
    this._btnRecord.addEventListener('click', () => this._startRecording());
    this._btnStop.addEventListener('click',   () => this._stopRecording());
    this._btnPlay.addEventListener('click',   () => this._playBack());
    this._btnExport.addEventListener('click', () => this._exportWav());
  }

  /* ------------------------------------------------------------------ */
  /* Recording                                                             */
  /* ------------------------------------------------------------------ */

  async _startRecording() {
    // Make sure audio context exists
    await this._engine.init();
    const ctx = this._engine.getContext();
    if (!ctx) return;

    this._events      = [];
    this._chunks      = [];
    this._isRecording = true;
    this._recordStart = performance.now();

    // Wire MediaRecorder to capture the mixed output
    this._mediaDestNode = ctx.createMediaStreamDestination();
    this._engine._masterGain?.connect(this._mediaDestNode);

    if (typeof MediaRecorder !== 'undefined') {
      try {
        const preferredTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
        ];
        const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
        this._mediaRecorder = mimeType
          ? new MediaRecorder(this._mediaDestNode.stream, { mimeType })
          : new MediaRecorder(this._mediaDestNode.stream);

        this._mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this._chunks.push(e.data);
        };
        this._mediaRecorder.start(100); // collect every 100 ms
      } catch (err) {
        console.warn('MediaRecorder unavailable, using offline WAV render only:', err);
        this._mediaRecorder = null;
      }
    } else {
      console.warn('MediaRecorder not supported, using offline WAV render only.');
      this._mediaRecorder = null;
    }

    // Setup VU meter analyser
    this._analyser = ctx.createAnalyser();
    this._analyser.fftSize = 256;
    this._engine._masterGain?.connect(this._analyser);
    this._startVuMeter();

    // Update UI
    this._btnRecord.classList.add('recording');
    this._btnRecord.setAttribute('aria-pressed', 'true');
    this._btnRecord.disabled = true;
    this._btnStop.disabled   = false;
    this._btnPlay.disabled   = true;
    this._btnExport.disabled = true;
    this._setStatus('Recording…');
  }

  _stopRecording() {
    if (!this._isRecording) return;
    this._isRecording = false;

    this._mediaRecorder?.stop();
    this._mediaDestNode?.disconnect();

    this._stopVuMeter();
    this._analyser?.disconnect();

    this._btnRecord.classList.remove('recording');
    this._btnRecord.setAttribute('aria-pressed', 'false');
    this._btnRecord.disabled = false;
    this._btnStop.disabled   = true;
    this._btnPlay.disabled   = this._events.length === 0;
    this._btnExport.disabled = this._events.length === 0;

    const dur = ((performance.now() - this._recordStart) / 1000).toFixed(1);
    this._setStatus(`Recorded ${this._events.length} events (${dur}s)`);
  }

  /* ------------------------------------------------------------------ */
  /* Playback via OfflineAudioContext                                      */
  /* ------------------------------------------------------------------ */

  async _playBack() {
    if (this._events.length === 0) return;
    if (!this._engine._ctx) return;

    // Build audio from events using OfflineAudioContext for accurate timing
    try {
      this._setStatus('Rendering playback…');
      const buffer = await this._renderAudio();
      if (!buffer) { this._setStatus('Nothing to play back.'); return; }

      this._recordedBuffer = buffer;
      const ctx    = this._engine.getContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      if (this._playbackSource) {
        try { this._playbackSource.stop(); } catch (_) { /* already ended */ }
      }
      this._playbackSource = source;

      source.start();
      source.onended = () => this._setStatus('Playback finished.');
      this._setStatus('Playing back…');
    } catch (err) {
      console.error('Playback error:', err);
      this._setStatus('Playback failed.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Export WAV                                                            */
  /* ------------------------------------------------------------------ */

  async _exportWav() {
    if (this._events.length === 0) return;

    // Try to use the recorded MediaRecorder chunks first (real audio)
    if (this._chunks.length > 0) {
      const blob = new Blob(this._chunks, { type: 'audio/webm' });
      this._downloadBlob(blob, 'snowflake-melody.webm');
      this._setStatus('Exported as WebM audio.');
      return;
    }

    // Fallback: render via OfflineAudioContext → PCM WAV
    try {
      this._setStatus('Rendering WAV…');
      const audioBuffer = await this._renderAudio();
      if (!audioBuffer) { this._setStatus('Nothing to export.'); return; }
      const wav  = _audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      this._downloadBlob(blob, 'snowflake-melody.wav');
      this._setStatus('Exported WAV.');
    } catch (err) {
      console.error('WAV export error:', err);
      this._setStatus('Export failed.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* OfflineAudioContext rendering                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Replay all recorded note events through an OfflineAudioContext.
   * @returns {Promise<AudioBuffer|null>}
   */
  async _renderAudio() {
    if (this._events.length === 0) return null;

    const sampleRate = 44100;
    const lastEvent  = this._events[this._events.length - 1];
    // Duration = last event time + generous tail for release
    const durationSec = (lastEvent.time / 1000) + 3;
    const length      = Math.ceil(sampleRate * durationSec);

    const offCtx = new OfflineAudioContext(2, length, sampleRate);

    // Build the same filter chain offline
    const masterGain = offCtx.createGain();
    masterGain.gain.value = this._engine.params.volume;

    const eqLow = offCtx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 250;
    eqLow.gain.value = this._engine.params.eqLow;

    const eqMid = offCtx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1;
    eqMid.gain.value = this._engine.params.eqMid;

    const eqHigh = offCtx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 8000;
    eqHigh.gain.value = this._engine.params.eqHigh;

    const filter = offCtx.createBiquadFilter();
    filter.type = this._engine.params.filterType;
    filter.frequency.value = this._engine.params.filterFreq;
    filter.Q.value = this._engine.params.filterRes;

    masterGain
      .connect(eqLow)
      .connect(eqMid)
      .connect(eqHigh)
      .connect(filter)
      .connect(offCtx.destination);

    const p = this._engine.params;

    /** @type {Map<number, {source: AudioBufferSourceNode, gain: GainNode}[]>} */
    const voiceMap = new Map();

    for (const evt of this._events) {
      const t = evt.time / 1000; // ms → s

      if (evt.type === 'noteOn') {
        const entries = this._engine.sampleMap.get(evt.midi);
        if (!entries || entries.length === 0) continue;

        const { buffer, rootNote } = entries[0];
        const semiDiff = (evt.midi - rootNote) + p.pitch;
        const pbRate   = Math.pow(2, semiDiff / 12);

        const src = offCtx.createBufferSource();
        src.buffer       = buffer;
        src.playbackRate.value = pbRate;

        const envGain = offCtx.createGain();
        const atkEnd  = t + p.attack;
        const decEnd  = atkEnd + p.decay;
        const peakVel = evt.velocity * p.velocity;

        envGain.gain.setValueAtTime(0, t);
        envGain.gain.linearRampToValueAtTime(peakVel, atkEnd);
        envGain.gain.linearRampToValueAtTime(peakVel * p.sustain, decEnd);

        src.connect(envGain);
        envGain.connect(masterGain);
        src.start(t);

        if (!voiceMap.has(evt.midi)) voiceMap.set(evt.midi, []);
        voiceMap.get(evt.midi).push({ source: src, gain: envGain });

      } else if (evt.type === 'noteOff') {
        const voices = voiceMap.get(evt.midi);
        if (!voices) continue;
        voices.forEach(({ source, gain }) => {
          gain.gain.setValueAtTime(gain.gain.value, t);
          gain.gain.linearRampToValueAtTime(0, t + p.release);
          try { source.stop(t + p.release + 0.05); } catch (_) { /* ended */ }
        });
        voiceMap.delete(evt.midi);
      }
    }

    return await offCtx.startRendering();
  }

  /* ------------------------------------------------------------------ */
  /* VU Meter                                                              */
  /* ------------------------------------------------------------------ */

  _startVuMeter() {
    if (!this._analyser) return;
    const canvas = this._vuCanvas;
    const ctx    = canvas.getContext('2d');
    const data   = new Uint8Array(this._analyser.frequencyBinCount);

    const draw = () => {
      this._vuAnimId = requestAnimationFrame(draw);
      this._analyser.getByteFrequencyData(data);

      // Compute average level
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg  = sum / data.length / 255;
      const w    = canvas.width;
      const h    = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1c1d24';
      ctx.fillRect(0, 0, w, h);

      const barW = avg * w;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0,    '#5cf0e0');
      grad.addColorStop(0.75, '#7b61ff');
      grad.addColorStop(1,    '#ff4f4f');
      ctx.fillStyle = grad;
      ctx.fillRect(2, 4, barW - 4, h - 8);
    };

    draw();
  }

  _stopVuMeter() {
    if (this._vuAnimId !== null) {
      cancelAnimationFrame(this._vuAnimId);
      this._vuAnimId = null;
    }
    const ctx = this._vuCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._vuCanvas.width, this._vuCanvas.height);
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                               */
  /* ------------------------------------------------------------------ */

  _setStatus(msg) {
    this._statusEl.textContent = msg;
  }

  /**
   * @param {Blob}   blob
   * @param {string} filename
   */
  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    // Revoke after short delay to allow download to start
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/* ------------------------------------------------------------------ */
/* PCM WAV encoder                                                       */
/* ------------------------------------------------------------------ */

/**
 * Encode an AudioBuffer as a 16-bit PCM WAV ArrayBuffer.
 * @param {AudioBuffer} audioBuffer
 * @returns {ArrayBuffer}
 */
function _audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate  = audioBuffer.sampleRate;
  const numSamples  = audioBuffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign  = numChannels * bytesPerSample;
  const byteRate    = sampleRate * blockAlign;
  const dataSize    = numSamples * blockAlign;
  const buffer      = new ArrayBuffer(44 + dataSize);
  const view        = new DataView(buffer);

  /* RIFF chunk */
  _writeString(view, 0,  'RIFF');
  view.setUint32(4,  36 + dataSize, true);
  _writeString(view, 8,  'WAVE');

  /* fmt sub-chunk */
  _writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);           // PCM chunk size
  view.setUint16(20, 1,  true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  /* data sub-chunk */
  _writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channel data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      // Clamp and convert to 16-bit int
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, Math.round(s * 0x7fff), true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * @param {DataView} view
 * @param {number}   offset
 * @param {string}   str
 */
function _writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
