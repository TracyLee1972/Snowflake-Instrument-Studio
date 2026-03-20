/**
 * app.js — Main application: wires all modules together.
 * Initialised on DOMContentLoaded.
 */
(function () {
  'use strict';

  /* ── Module instances ── */
  const audioEngine = new AudioEngine();
  let piano, sampleManager, recorder, presetManager, controls;

  /* ── State ── */
  let bgDataUrl = null;

  /* ─────────────────────────────────────────
     Helpers
  ───────────────────────────────────────── */
  const $ = id => document.getElementById(id);

  function showStatus(msg, type = 'info') {
    const el = $('key-info');
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'error' ? '#ff5e7d' : type === 'ok' ? '#44d9a2' : '#7a8092';
    clearTimeout(showStatus._timer);
    showStatus._timer = setTimeout(() => { el.textContent = '— ready —'; el.style.color = ''; }, 3000);
  }

  /* ── Build note-name select options (MIDI 0–127) ── */
  function buildNoteSelects() {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const selects = ['root-note-select','lo-note-select','hi-note-select'];
    for (const id of selects) {
      const sel = $(id);
      if (!sel) continue;
      sel.innerHTML = '';
      for (let midi = 0; midi <= 127; midi++) {
        const oct  = Math.floor(midi / 12) - 1;
        const name = names[midi % 12] + oct;
        const opt  = document.createElement('option');
        opt.value       = midi;
        opt.textContent = `${name} (${midi})`;
        sel.appendChild(opt);
      }
    }
  }

  /* ── Populate mapping selects from selected sample ── */
  function updateMappingSelects() {
    const s = sampleManager.getSelected();
    if (!s) return;
    $('root-note-select').value = s.rootNote;
    $('lo-note-select').value   = s.loNote;
    $('hi-note-select').value   = s.hiNote;
  }

  /* ── Refresh sample list UI ── */
  function renderSampleList(samples) {
    const list = $('sample-list');
    list.innerHTML = '';

    if (!samples.length) {
      list.innerHTML = '<div class="empty-list-hint">No samples loaded</div>';
      updatePianoMapping();
      return;
    }

    for (const s of samples) {
      const div = document.createElement('div');
      div.className = 'sample-item' + (sampleManager.getSelected()?.id === s.id ? ' selected' : '');
      div.innerHTML = `
        <span class="sample-dot${s.rootNote !== undefined ? ' mapped' : ''}"></span>
        <span class="sample-name" title="${s.name}">${s.name}</span>
        <span class="sample-root">${midiToName(s.rootNote)}</span>
        <button class="sample-del" data-id="${s.id}" title="Remove">✕</button>`;

      div.addEventListener('click', (e) => {
        if (e.target.classList.contains('sample-del')) return;
        sampleManager.select(s.id);
        renderSampleList(sampleManager.getSamples());
        updateMappingSelects();
      });

      div.querySelector('.sample-del').addEventListener('click', (e) => {
        e.stopPropagation();
        sampleManager.removeSample(s.id);
      });

      list.appendChild(div);
    }

    updatePianoMapping();
  }

  /* ── Update piano key highlights ── */
  function updatePianoMapping() {
    const samples = sampleManager.getSamples();
    const rootNotes = samples.map(s => s.rootNote);
    const rangeNotes = [];
    for (const s of samples) {
      for (let n = s.loNote; n <= s.hiNote; n++) rangeNotes.push(n);
    }
    piano.setMappedNotes(rangeNotes);
    piano.setRootNotes(rootNotes);
    drawMappingBar(samples);
  }

  /* ── Draw the mapping bar canvas ── */
  function drawMappingBar(samples) {
    const canvas = $('mapping-canvas');
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width  = parent.clientWidth || 600;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width;
    const H = canvas.height;

    // Background grid (octave lines)
    ctx.fillStyle = '#1a1d25';
    ctx.fillRect(0, 0, W, H);

    for (let oct = 0; oct <= 10; oct++) {
      const x = (oct * 12 / 128) * W;
      ctx.strokeStyle = '#2e3340';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Sample ranges
    const colors = ['#4a9eff','#44d9a2','#ff9f4a','#ff5e7d','#c97bff','#79e0d0','#ffda6a'];
    samples.forEach((s, i) => {
      const x1 = (s.loNote   / 128) * W;
      const x2 = ((s.hiNote + 1) / 128) * W;
      ctx.fillStyle = colors[i % colors.length] + '66';
      ctx.fillRect(x1, 2, x2 - x1, H - 4);
      // Root note marker
      const rx = (s.rootNote / 128) * W;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(rx, 0, 2, H);
    });

    // Note labels at C positions
    ctx.fillStyle = '#4a4f5e';
    ctx.font = '8px monospace';
    ctx.textBaseline = 'middle';
    for (let oct = 0; oct <= 9; oct++) {
      const midi = (oct + 1) * 12; // C notes
      const x = (midi / 128) * W;
      ctx.fillText(`C${oct}`, x + 2, H / 2);
    }
  }

  function midiToName(midi) {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const oct   = Math.floor(midi / 12) - 1;
    return names[midi % 12] + oct;
  }

  /* ── Sync controls UI to AudioEngine (after preset load) ── */
  function syncControlsToEngine() {
    const e = audioEngine;

    function timeToSlider(t) { return Math.round(Math.sqrt(t / 5) * 100); }
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const set = (id, v) => { const el = $(id); if (el) el.value = v; el?.dispatchEvent(new Event('input')); };

    set('adsr-attack',  timeToSlider(e.attack));
    set('adsr-decay',   timeToSlider(e.decay));
    set('adsr-sustain', clamp(Math.round(e.sustain * 100), 0, 100));
    set('adsr-release', timeToSlider(e.release));
    set('master-vol',   clamp(Math.round(e.masterVolume * 100), 0, 100));
    set('vel-sens',     clamp(Math.round(e.velocitySens * 100), 0, 100));
    set('eq-low',  clamp(Math.round(e.eqLow),  -12, 12));
    set('eq-mid',  clamp(Math.round(e.eqMid),  -12, 12));
    set('eq-high', clamp(Math.round(e.eqHigh), -12, 12));

    const ftEl = $('filter-type');
    if (ftEl) { ftEl.value = e.filterType; ftEl.dispatchEvent(new Event('change')); }

    const rrEl = $('rr-enable');
    if (rrEl) rrEl.checked = e.roundRobinEnabled;

    if (controls?.knobs) {
      const kfq = controls.knobs.get('knob-filter-freq');
      if (kfq) { kfq.setValue(e.filterFreq); }
      const kfqQ = controls.knobs.get('knob-filter-q');
      if (kfqQ) { kfqQ.setValue(e.filterQ); }
    }

    controls?.drawADSR?.();
  }

  /* ─────────────────────────────────────────
     Init
  ───────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {

    /* ── Note selects ── */
    buildNoteSelects();

    /* ── Piano keyboard ── */
    piano = new PianoKeyboard($('piano-container'), {
      onNoteOn(midi, velocity) {
        audioEngine.noteOn(midi, velocity);
        recorder.recordNoteOn(midi, velocity);
        const name = midiToName(midi);
        $('key-info').textContent = `▶ ${name}  (MIDI ${midi})`;
        $('key-info').style.color = '#4a9eff';
      },
      onNoteOff(midi) {
        audioEngine.noteOff(midi);
        recorder.recordNoteOff(midi);
        $('key-info').textContent = '— ready —';
        $('key-info').style.color = '';
      },
    });

    /* ── Sample Manager ── */
    sampleManager = new SampleManager(audioEngine, renderSampleList);

    /* ── Recorder ── */
    recorder = new Recorder(audioEngine, {
      onStateChange(state) {
        const dot     = $('rec-dot');
        const timeEl  = $('rec-time');
        const eventsEl = $('rec-events');
        const recBtn  = $('btn-record');

        if (timeEl)   timeEl.textContent  = recorder.getElapsedString();
        if (dot)      dot.classList.toggle('active', state === 'recording');
        if (recBtn)   recBtn.classList.toggle('active', state === 'recording');

        if (eventsEl) {
          const n = recorder.events.length;
          eventsEl.textContent = n ? `${n} events` : '— no recording —';
        }
      },
    });

    /* ── Preset Manager ── */
    presetManager = new PresetManager(audioEngine, sampleManager);

    /* ── Controls ── */
    controls = initControls(audioEngine);

    /* ── Octave navigation ── */
    $('btn-oct-up').addEventListener('click',   () => updateOctaveDisplay(piano.shiftOctave(+1)));
    $('btn-oct-down').addEventListener('click', () => updateOctaveDisplay(piano.shiftOctave(-1)));

    function updateOctaveDisplay(oct) {
      $('octave-display').textContent = `C${oct}–B${oct + 3}`;
    }

    /* ── Sustain toggle ── */
    $('toggle-sustain').addEventListener('change', (e) => piano.setSustain(e.target.checked));

    /* ─── Sample loading ─── */
    const dropZone  = $('drop-zone');
    const fileInput = $('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      await loadFiles(fileInput.files);
      fileInput.value = '';
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      await loadFiles(e.dataTransfer.files);
    });

    async function loadFiles(fileList) {
      const files = [...fileList].filter(f => f.name.toLowerCase().endsWith('.wav'));
      if (!files.length) { showStatus('No WAV files found', 'error'); return; }
      showStatus(`Loading ${files.length} file(s)…`);
      await sampleManager.loadFiles(files);
      showStatus(`Loaded ${files.length} sample(s)`, 'ok');
    }

    /* ── Batch import ── */
    const batchInput = $('batch-import-input');
    $('btn-batch-import').addEventListener('click', () => batchInput.click());
    batchInput.addEventListener('change', async () => {
      await loadFiles(batchInput.files);
      batchInput.value = '';
    });

    /* ── Auto map ── */
    $('btn-auto-map').addEventListener('click', () => {
      sampleManager.autoMap();
      showStatus('Auto-mapped samples across keyboard', 'ok');
    });

    /* ── Mapping apply ── */
    $('btn-apply-mapping').addEventListener('click', () => {
      const sel = sampleManager.getSelected();
      if (!sel) { showStatus('Select a sample first', 'error'); return; }
      const root = +$('root-note-select').value;
      const lo   = +$('lo-note-select').value;
      const hi   = +$('hi-note-select').value;
      if (lo > hi) { showStatus('Lo note must be ≤ Hi note', 'error'); return; }
      sampleManager.applyMapping(sel.id, root, lo, hi);
      showStatus(`Mapped ${sel.name} → ${midiToName(root)} [${midiToName(lo)}–${midiToName(hi)}]`, 'ok');
    });

    $('btn-clear-mapping').addEventListener('click', () => {
      const sel = sampleManager.getSelected();
      if (!sel) return;
      sampleManager.removeSample(sel.id);
      showStatus('Sample removed', 'ok');
    });

    /* ── Background image ── */
    const bgInput = $('bg-image-input');
    $('btn-upload-bg').addEventListener('click', () => bgInput.click());
    bgInput.addEventListener('change', () => {
      const file = bgInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        bgDataUrl = e.target.result;
        $('instrument-bg').style.backgroundImage = `url(${bgDataUrl})`;
        $('instrument-bg').style.backgroundSize  = 'cover';
        $('instrument-bg').style.backgroundPosition = 'center';
      };
      reader.readAsDataURL(file);
    });

    /* ── Recorder buttons ── */
    $('btn-record').addEventListener('click', () => {
      if (recorder.state === 'recording') {
        recorder.stop();
        showStatus('Recording stopped', 'ok');
      } else {
        recorder.startRecording();
        showStatus('⏺ Recording…');
      }
    });

    $('btn-play').addEventListener('click', () => {
      if (recorder.state === 'playing') return;
      if (!recorder.events.length) { showStatus('Nothing recorded yet', 'error'); return; }
      recorder.playback();
      showStatus('▶ Playing back…');
    });

    $('btn-stop').addEventListener('click', () => {
      recorder.stop();
      piano.allNotesOff();
      showStatus('Stopped');
    });

    /* ── Export WAV ── */
    $('btn-export-wav').addEventListener('click', async () => {
      if (!recorder.events.length) { showStatus('Record something first', 'error'); return; }
      showStatus('Rendering WAV…');
      const name = ($('instrument-name').value || 'melody').replace(/[^a-z0-9_\-]/gi, '_') + '.wav';
      const ok = await recorder.exportWAV(name);
      showStatus(ok ? 'WAV exported ✓' : 'Export failed', ok ? 'ok' : 'error');
    });

    /* ── New instrument ── */
    $('btn-new').addEventListener('click', () => {
      if (!confirm('Start a new instrument? Unsaved changes will be lost.')) return;
      sampleManager.clear();
      bgDataUrl = null;
      $('instrument-bg').style.backgroundImage = '';
      $('instrument-name').value = 'My Instrument';
      recorder.stop();
      recorder.events = [];
      showStatus('New instrument created', 'ok');
    });

    /* ── Save preset ── */
    $('btn-save').addEventListener('click', async () => {
      showStatus('Saving…');
      await presetManager.saveToFile({
        includeSamples: true,
        includeImage: true,
        instrumentName: $('instrument-name').value,
        license: $('license-type').value,
        bgDataUrl,
      });
      showStatus('Preset saved ✓', 'ok');
    });

    /* ── Load preset ── */
    const loadInput = $('load-preset-input');
    $('btn-load').addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', async () => {
      const file = loadInput.files[0];
      if (!file) return;
      showStatus('Loading preset…');
      try {
        const preset = await presetManager.loadFromFile(file);
        $('instrument-name').value = preset.name || 'My Instrument';
        if ($('license-type') && preset.license) $('license-type').value = preset.license;
        if (preset.backgroundImage) {
          bgDataUrl = preset.backgroundImage;
          $('instrument-bg').style.backgroundImage = `url(${bgDataUrl})`;
          $('instrument-bg').style.backgroundSize  = 'cover';
          $('instrument-bg').style.backgroundPosition = 'center';
        }
        syncControlsToEngine();
        showStatus('Preset loaded ✓', 'ok');
      } catch (err) {
        showStatus('Failed to load preset: ' + err.message, 'error');
      }
      loadInput.value = '';
    });

    /* ── Share modal ── */
    $('btn-share').addEventListener('click', () => {
      $('modal-overlay').classList.remove('hidden');
    });
    $('modal-close').addEventListener('click', () => {
      $('modal-overlay').classList.add('hidden');
    });
    $('modal-overlay').addEventListener('click', (e) => {
      if (e.target === $('modal-overlay')) $('modal-overlay').classList.add('hidden');
    });

    $('btn-export-preset').addEventListener('click', async () => {
      showStatus('Exporting…');
      await presetManager.saveToFile({
        includeSamples: $('inc-samples').checked,
        includeImage:   $('inc-image').checked,
        instrumentName: $('instrument-name').value,
        license:        $('license-type').value,
        bgDataUrl,
      });
      $('modal-overlay').classList.add('hidden');
      showStatus('Preset exported ✓', 'ok');
    });

    /* ── Mapping bar resize ── */
    window.addEventListener('resize', () => {
      drawMappingBar(sampleManager.getSamples());
    });

    /* ── Initial render ── */
    renderSampleList([]);
    updateOctaveDisplay(piano.viewOctave);

    console.log('🎵 Snowflake Instrument Studio ready');
  });

})();
