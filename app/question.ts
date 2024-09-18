import { encodeDomainName, readDomainName } from "./utils";

export class DNSQuestion {
  name: string;
  type: number;
  class: number;

  constructor() {
    this.name = '';
    this.type = 1; // A record
    this.class = 1; // IN
  }

  fromBuffer(buffer: Buffer, offset: number): number {
    [this.name, offset] = readDomainName(buffer, offset);

    if (offset + 4 > buffer.length) {
      throw new Error("Buffer overrun while reading question type and class");
    }
    this.type = buffer.readUInt16BE(offset);
    offset += 2;
    this.class = buffer.readUInt16BE(offset);
    offset += 2;

    return offset;
  }

  toBuffer(): Buffer {
    const nameBuffer = encodeDomainName(this.name);
    const buffer = Buffer.alloc(nameBuffer.length + 4);
    nameBuffer.copy(buffer, 0);
    buffer.writeUInt16BE(this.type, nameBuffer.length);
    buffer.writeUInt16BE(this.class, nameBuffer.length + 2);
    return buffer;
  }
}