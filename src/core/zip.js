const encoder = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function littleEndian(size, values) {
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);
  values.forEach(([offset, type, value]) => view[`set${type}`](offset, value, true));
  return new Uint8Array(buffer);
}

function concat(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

/** Creates a standards-compliant ZIP archive using the uncompressed STORE method. */
export function createStoredZip(files, options = {}) {
  const modifiedAt = options.modifiedAt ?? new Date();
  const { dosTime, dosDate } = dosDateTime(modifiedAt);
  const localChunks = [];
  const centralChunks = [];
  let localOffset = 0;

  for (const file of files) {
    if (!file?.name) throw new Error('Every ZIP entry needs a file name.');
    const name = encoder.encode(file.name.replaceAll('\\', '/'));
    const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data ?? ''));
    const crc = crc32(data);
    const localHeader = littleEndian(30, [
      [0, 'Uint32', 0x04034b50], [4, 'Uint16', 20], [6, 'Uint16', 0x0800], [8, 'Uint16', 0],
      [10, 'Uint16', dosTime], [12, 'Uint16', dosDate], [14, 'Uint32', crc], [18, 'Uint32', data.length],
      [22, 'Uint32', data.length], [26, 'Uint16', name.length], [28, 'Uint16', 0],
    ]);
    localChunks.push(localHeader, name, data);

    const centralHeader = littleEndian(46, [
      [0, 'Uint32', 0x02014b50], [4, 'Uint16', 20], [6, 'Uint16', 20], [8, 'Uint16', 0x0800],
      [10, 'Uint16', 0], [12, 'Uint16', dosTime], [14, 'Uint16', dosDate], [16, 'Uint32', crc],
      [20, 'Uint32', data.length], [24, 'Uint32', data.length], [28, 'Uint16', name.length], [30, 'Uint16', 0],
      [32, 'Uint16', 0], [34, 'Uint16', 0], [36, 'Uint16', 0], [38, 'Uint32', 0], [42, 'Uint32', localOffset],
    ]);
    centralChunks.push(centralHeader, name);
    localOffset += localHeader.length + name.length + data.length;
  }

  const central = concat(centralChunks);
  const local = concat(localChunks);
  const end = littleEndian(22, [
    [0, 'Uint32', 0x06054b50], [4, 'Uint16', 0], [6, 'Uint16', 0], [8, 'Uint16', files.length],
    [10, 'Uint16', files.length], [12, 'Uint32', central.length], [16, 'Uint32', local.length], [20, 'Uint16', 0],
  ]);
  return concat([local, central, end]);
}

export function downloadBytes(filename, bytes, type = 'application/zip') {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
