export class DNSHeader {
  id: number;
  qr: boolean;
  opcode: number;
  aa: boolean;
  tc: boolean;
  rd: boolean;
  ra: boolean;
  z: number;
  rcode: number;
  qdCount: number;
  anCount: number;
  nsCount: number;
  arCount: number;

  constructor() {
    this.id = 0;
    this.qr = false;
    this.opcode = 0;
    this.aa = false;
    this.tc = false;
    this.rd = false;
    this.ra = false;
    this.z = 0;
    this.rcode = 0;
    this.qdCount = 0;
    this.anCount = 0;
    this.nsCount = 0;
    this.arCount = 0;
  }

  fromBuffer(buffer: Buffer) {
    this.id = buffer.readUInt16BE(0);
    const flags1 = buffer.readUInt8(2);
    this.qr = (flags1 & 0x80) !== 0;
    this.opcode = (flags1 >> 3) & 0x0F;
    this.aa = (flags1 & 0x04) !== 0;
    this.tc = (flags1 & 0x02) !== 0;
    this.rd = (flags1 & 0x01) !== 0;
    const flags2 = buffer.readUInt8(3);
    this.ra = (flags2 & 0x80) !== 0;
    this.z = (flags2 >> 4) & 0x07;
    this.rcode = flags2 & 0x0F;
    this.qdCount = buffer.readUInt16BE(4);
    this.anCount = buffer.readUInt16BE(6);
    this.nsCount = buffer.readUInt16BE(8);
    this.arCount = buffer.readUInt16BE(10);
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(12);
    buffer.writeUInt16BE(this.id, 0);
    let flags1 = (this.qr ? 0x80 : 0) | (this.opcode << 3) | (this.aa ? 0x04 : 0) | (this.tc ? 0x02 : 0) | (this.rd ? 0x01 : 0);
    buffer.writeUInt8(flags1, 2);
    let flags2 = (this.ra ? 0x80 : 0) | (this.z << 4) | this.rcode;
    buffer.writeUInt8(flags2, 3);
    buffer.writeUInt16BE(this.qdCount, 4);
    buffer.writeUInt16BE(this.anCount, 6);
    buffer.writeUInt16BE(this.nsCount, 8);
    buffer.writeUInt16BE(this.arCount, 10);
    return buffer;
  }
}