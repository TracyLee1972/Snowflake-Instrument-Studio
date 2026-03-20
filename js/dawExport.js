/**
 * dawExport.js
 * Export the current instrument as a ZIP containing WAV files and mapping text.
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   buffer: ArrayBuffer,
 *   rootNote: number,
 *   loNote: number,
 *   hiNote: number,
 * }} SampleEntry
 */

/**
 * Export mapped samples as a ZIP file.
 *
 * @param {string} presetName
 * @param {SampleEntry[]} samples
 * @returns {Promise<void>}
 */
export async function exportInstrumentForDaw(presetName, samples) {
  if (!samples || samples.length === 0) {
    throw new Error('No samples loaded. Import WAV files first.');
  }

  const safePreset = _sanitizeFileName(presetName || 'snowflake-instrument');
  const usedNames = new Set();

  /** @type {{ name: string, data: Uint8Array }[]} */
  const files = [];

  samples.forEach((entry, index) => {
    const base = _sanitizeFileName(entry.name || `sample-${index + 1}`);
    const unique = _dedupeFileName(base, usedNames);
    files.push({
      name: `${unique}.wav`,
      data: new Uint8Array(entry.buffer),
    });
  });

  const instructions = [
    `Snowflake Instrument Studio ZIP Export`,
    ``,
    `Archive: ${safePreset}.zip`,
    ``,
    `Sample key mapping (lo-hi, root):`,
    ...samples.map((entry, index) => {
      const base = _sanitizeFileName(entry.name || `sample-${index + 1}`);
      return `- ${base}.wav => keys ${_clampMidi(entry.loNote)}-${_clampMidi(entry.hiNote)}, root ${_clampMidi(entry.rootNote)}`;
    }),
  ].join('\n');

  files.push({
    name: `${safePreset}-mapping.txt`,
    data: new TextEncoder().encode(instructions),
  });

  const zipBytes = _createZip(files);
  const zipBlob = new Blob([zipBytes], { type: 'application/zip' });
  await _downloadBlob(zipBlob, `${safePreset}.zip`);
}

/**
 * @param {number} n
 * @returns {number}
 */
function _clampMidi(n) {
  return Math.max(0, Math.min(127, Number.isFinite(n) ? Math.round(n) : 60));
}

/**
 * @param {string} name
 * @returns {string}
 */
function _sanitizeFileName(name) {
  const cleaned = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return cleaned || 'instrument';
}

/**
 * @param {string} base
 * @param {Set<string>} used
 * @returns {string}
 */
function _dedupeFileName(base, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base}_${i}`)) {
    i += 1;
  }
  const next = `${base}_${i}`;
  used.add(next);
  return next;
}

/**
 * @param {Blob} blob
 * @param {string} fileName
 * @returns {Promise<void>}
 */
async function _downloadBlob(blob, fileName) {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'ZIP archive',
          accept: { 'application/zip': ['.zip'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return;
      }
      console.warn('showSaveFilePicker failed, falling back to download link:', err);
    }
  }

  const url = URL.createObjectURL(blob);
  _showManualDownloadLink(url, fileName);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * @param {string} url
 * @param {string} fileName
 */
function _showManualDownloadLink(url, fileName) {
  const existing = document.getElementById('manual-export-download');
  if (existing) {
    existing.remove();
  }

  const wrap = document.createElement('div');
  wrap.id = 'manual-export-download';
  wrap.style.position = 'fixed';
  wrap.style.right = '16px';
  wrap.style.bottom = '16px';
  wrap.style.zIndex = '2000';
  wrap.style.background = '#242530';
  wrap.style.color = '#e8eaf0';
  wrap.style.border = '1px solid #2e303c';
  wrap.style.borderLeft = '3px solid #5cf0e0';
  wrap.style.borderRadius = '6px';
  wrap.style.padding = '10px 12px';
  wrap.style.boxShadow = '0 2px 12px rgba(0,0,0,0.45)';
  wrap.style.maxWidth = '320px';
  wrap.style.font = '12px Segoe UI, system-ui, sans-serif';

  const text = document.createElement('div');
  text.textContent = 'If the ZIP did not download automatically, click below:';
  text.style.marginBottom = '8px';

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.textContent = `Download ${fileName}`;
  link.style.color = '#5cf0e0';
  link.style.textDecoration = 'underline';

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.style.marginLeft = '10px';
  close.style.background = 'transparent';
  close.style.color = '#e8eaf0';
  close.style.border = '1px solid #2e303c';
  close.style.borderRadius = '4px';
  close.style.padding = '2px 8px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => wrap.remove());

  wrap.appendChild(text);
  wrap.appendChild(link);
  wrap.appendChild(close);
  document.body.appendChild(wrap);
}

/**
 * Create a simple ZIP archive using the "store" method (no compression).
 * @param {{ name: string, data: Uint8Array }[]} files
 * @returns {Uint8Array}
 */
function _createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const fileNameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = _crc32(data);

    const localHeader = new Uint8Array(30 + fileNameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, fileNameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(fileNameBytes, 30);
    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, fileNameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(fileNameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const totalSize = offset + centralSize + endRecord.length;
  const zip = new Uint8Array(totalSize);
  let cursor = 0;

  for (const part of localParts) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centralParts) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  zip.set(endRecord, cursor);

  return zip;
}

/**
 * @param {Uint8Array} data
 * @returns {number}
 */
function _crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ _CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const _CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();
