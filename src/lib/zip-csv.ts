import { inflateRawSync } from "node:zlib";

const LOCAL_FILE = 0x04034b50;

export function unzipNamed(buf: Buffer, match: (name: string) => boolean): string {
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== LOCAL_FILE) break;
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const start = offset + 30 + nameLen + extraLen;
    const end = start + (compSize || 0);
    const data = buf.subarray(start, end);
    if (match(name) && data.length) {
      const raw = method === 0 ? data : inflateRawSync(data);
      return raw.toString("latin1");
    }
    offset = end;
  }
  throw new Error("zip_entry_missing");
}

export function unzipFirst(buf: Buffer): string {
  return unzipNamed(buf, () => true);
}
