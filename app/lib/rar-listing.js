/**
 * Lists the files in a RAR archive from its headers alone: names, sizes and
 * folders, without decompressing anything. Both formats are read: RAR 5 (every
 * RAR on the site today) and the older RAR 4.
 *
 * RAR 5: https://www.rarlab.com/technote.htm
 * RAR 4: the "RAR 2.9-4.x" block layout from the same author's technote.
 */

const RAR5_SIGNATURE = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00];
const RAR4_SIGNATURE = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00];
/** Bounds the work on a hostile archive: no real course archive comes near it. */
const MAX_ENTRIES = 5000;

export class RarListingError extends Error {}

function startsWith(bytes, signature) {
  return signature.every((byte, i) => bytes[i] === byte);
}

export function rarVersion(bytes) {
  if (startsWith(bytes, RAR5_SIGNATURE)) return 5;
  if (startsWith(bytes, RAR4_SIGNATURE)) return 4;
  return null;
}

/** RAR 5 variable-length integer: 7 bits per byte, high bit means "more". */
function readVint(bytes, offset) {
  let value = 0;
  let shift = 0;
  for (let i = 0; i < 10; i += 1) {
    const byte = bytes[offset + i];
    if (byte === undefined) throw new RarListingError("truncated header");
    value += (byte & 0x7f) * 2 ** shift;
    shift += 7;
    if (!(byte & 0x80)) return { value, offset: offset + i + 1 };
  }
  throw new RarListingError("malformed number");
}

const decoder = new TextDecoder();

function listRar5(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = [];
  let pos = RAR5_SIGNATURE.length;
  while (pos < bytes.length) {
    const start = pos + 4; // skip the header CRC32
    const size = readVint(bytes, start);
    const headerEnd = size.offset + size.value;
    if (size.value === 0 || headerEnd > bytes.length) throw new RarListingError("truncated header");
    let p = size.offset;
    const type = readVint(bytes, p);
    p = type.offset;
    const flags = readVint(bytes, p);
    p = flags.offset;
    if (flags.value & 0x0001) p = readVint(bytes, p).offset; // extra area size
    let dataSize = 0;
    if (flags.value & 0x0002) {
      const data = readVint(bytes, p);
      dataSize = data.value;
      p = data.offset;
    }

    if (type.value === 4) throw new RarListingError("encrypted");
    if (type.value === 5) break; // end of archive
    if (type.value === 2) {
      const fileFlags = readVint(bytes, p);
      p = fileFlags.offset;
      const unpacked = readVint(bytes, p);
      p = readVint(bytes, unpacked.offset).offset; // attributes
      if (fileFlags.value & 0x0002) p += 4; // modification time
      if (fileFlags.value & 0x0004) p += 4; // data CRC32
      p = readVint(bytes, p).offset; // compression info
      p = readVint(bytes, p).offset; // host OS
      const nameLength = readVint(bytes, p);
      p = nameLength.offset;
      if (p + nameLength.value > headerEnd) throw new RarListingError("truncated name");
      entries.push({
        path: decoder.decode(bytes.subarray(p, p + nameLength.value)),
        size: fileFlags.value & 0x0008 ? null : unpacked.value,
        dir: Boolean(fileFlags.value & 0x0001),
      });
      if (entries.length > MAX_ENTRIES) throw new RarListingError("too many entries");
    }
    pos = headerEnd + dataSize;
  }
  return entries;
}

function listRar4(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = [];
  let pos = RAR4_SIGNATURE.length;
  while (pos + 7 <= bytes.length) {
    const type = bytes[pos + 2];
    const flags = view.getUint16(pos + 3, true);
    const headSize = view.getUint16(pos + 5, true);
    if (headSize < 7) throw new RarListingError("malformed block");
    let addSize = flags & 0x8000 ? view.getUint32(pos + 7, true) : 0;

    if (type === 0x73 && flags & 0x0080) throw new RarListingError("encrypted");
    if (type === 0x7b) break; // end of archive
    if (type === 0x74) {
      if (pos + 32 > bytes.length) throw new RarListingError("truncated header");
      const packSize = view.getUint32(pos + 7, true);
      let unpacked = view.getUint32(pos + 11, true);
      const nameSize = view.getUint16(pos + 26, true);
      let nameAt = pos + 32;
      if (flags & 0x0100) {
        addSize = packSize + view.getUint32(pos + 32, true) * 2 ** 32;
        unpacked += view.getUint32(pos + 36, true) * 2 ** 32;
        nameAt += 8;
      } else {
        addSize = packSize;
      }
      let raw = bytes.subarray(nameAt, nameAt + nameSize);
      // Unicode names carry an ASCII copy before a NUL; that copy is what we show.
      const nul = raw.indexOf(0);
      if (nul !== -1) raw = raw.subarray(0, nul);
      entries.push({
        path: decoder.decode(raw).replace(/\\/g, "/"),
        size: unpacked,
        dir: (flags & 0x00e0) === 0x00e0,
      });
      if (entries.length > MAX_ENTRIES) throw new RarListingError("too many entries");
    }
    const next = pos + headSize + addSize;
    if (next <= pos) throw new RarListingError("no progress");
    pos = next;
  }
  return entries;
}

/**
 * Files and folders in the archive, in archive order.
 * @param {Uint8Array} bytes
 * @returns {{ path: string, size: number | null, dir: boolean }[]}
 */
export function listRarEntries(bytes) {
  const version = rarVersion(bytes);
  if (version === 5) return listRar5(bytes);
  if (version === 4) return listRar4(bytes);
  throw new RarListingError("not a RAR archive");
}
