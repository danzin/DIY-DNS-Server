import { DNSQuestion, DNSRecord } from "./types";

export class DNSMessage {
  packetId: number = 0;
  flags: number = 0;
  opcode: number = 0;
  questions: DNSQuestion[] = [];
  answers: DNSRecord[] = [];
  authority: DNSRecord[] = [];  
  additional: DNSRecord[] = []; 

  constructor(data?: Buffer) {
    if (data) {
      this.parse(data);
    }
  }
    
  parse(data: Buffer): void {
    let offset = 0;
    
    // Parse header
    this.packetId = data.readUInt16BE(offset);
    offset += 2;
    
    this.flags = data.readUInt16BE(offset);
    this.opcode = (this.flags >> 11) & 0xF;
    offset += 2;
    
    const qdcount = data.readUInt16BE(offset);
    offset += 2;
    const ancount = data.readUInt16BE(offset);
    offset += 2;
    const nscount = data.readUInt16BE(offset);
    offset += 2;
    const arcount = data.readUInt16BE(offset);
    offset += 2;

    //Parse questions
    for (let i = 0; i < qdcount; i++) {
      const [question, newOffset] = this.parseDNSQuestion(data, offset);
      this.questions.push(question);
      offset = newOffset;
    }

    //Parse answers
    for (let i = 0; i < ancount; i++) {
      const [answer, newOffset] = this.parseAnswer(data, offset);
      this.answers.push(answer);
      offset = newOffset;
    }

    //Parse authority records
    for (let i = 0; i < nscount; i++) {
      const [auth, newOffset] = this.parseAnswer(data, offset);
      this.authority.push(auth);
      offset = newOffset;
    }

    //Parse additional records
    for (let i = 0; i < arcount; i++) {
      const [additional, newOffset] = this.parseAnswer(data, offset);
      this.additional.push(additional);
      offset = newOffset;
    }
  }

  toBuffer(): Buffer {
    const headerBuffer = Buffer.alloc(12);
    headerBuffer.writeUInt16BE(this.packetId, 0);
    headerBuffer.writeUInt16BE(this.flags, 2);
    headerBuffer.writeUInt16BE(this.questions.length, 4);
    headerBuffer.writeUInt16BE(this.answers.length, 6);
    headerBuffer.writeUInt16BE(this.authority.length, 8);
    headerBuffer.writeUInt16BE(this.additional.length, 10);

    const questionBuffers = this.questions.map(q => this.questionToBuffer(q));
    const answerBuffers = this.answers.map(a => this.answerToBuffer(a));
    const authorityBuffers = this.authority.map(a => this.answerToBuffer(a));
    const additionalBuffers = this.additional.map(a => this.answerToBuffer(a));

    return Buffer.concat([
      headerBuffer,
      ...questionBuffers,
      ...answerBuffers,
      ...authorityBuffers,
      ...additionalBuffers
    ]);
  }

  private parseDNSQuestion(data: Buffer, offset: number): [DNSQuestion, number] {
    const [name, newOffset] = this.parseName(data, offset);
    const qtype = data.readUInt16BE(newOffset);
    const qclass = data.readUInt16BE(newOffset + 2);
    return [{ name, qtype, qclass }, newOffset + 4];
  }

  private parseAnswer(data: Buffer, offset: number): [DNSRecord, number] {
    const [name, newOffset] = this.parseName(data, offset);
    const type = data.readUInt16BE(newOffset);
    const cls = data.readUInt16BE(newOffset + 2);
    const ttl = data.readUInt32BE(newOffset + 4);
    const rdlength = data.readUInt16BE(newOffset + 8);
    const rdata = data.slice(newOffset + 10, newOffset + 10 + rdlength);
    return [{ name, type, cls, ttl, rdlength, rdata }, newOffset + 10 + rdlength];
  }

  private parseName(data: Buffer, offset: number): [string, number] {
    const labels: string[] = [];
    let currentOffset = offset;
    let jumping = false;
    let jumpOffset = -1;

    while (true) {
      const length = data[currentOffset];
      if (length === 0) {
        if (!jumping) currentOffset++;
        break;
      }
      if ((length & 0xc0) === 0xc0) {
        if (!jumping) {
          jumpOffset = currentOffset + 2;
        }
        const pointerOffset = ((length & 0x3f) << 8) | data[currentOffset + 1];
        currentOffset = pointerOffset;
        jumping = true;
      } else {
        currentOffset++;
        labels.push(data.slice(currentOffset, currentOffset + length).toString('ascii'));
        currentOffset += length;
      }
    }
    return [labels.join('.'), jumping ? jumpOffset : currentOffset];
  }

  private nameToBuffer(name: string): Buffer {
    const parts = name.split('.');
    const buffers = parts.map(part => {
      const buffer = Buffer.alloc(part.length + 1);
      buffer.writeUInt8(part.length, 0);
      buffer.write(part, 1);
      return buffer;
    });
    return Buffer.concat([...buffers, Buffer.from([0])]);
  }

  private questionToBuffer(question: DNSQuestion): Buffer {
    const nameBuffer = this.nameToBuffer(question.name);
    const typeClassBuffer = Buffer.alloc(4);
    typeClassBuffer.writeUInt16BE(question.qtype, 0);
    typeClassBuffer.writeUInt16BE(question.qclass, 2);
    return Buffer.concat([nameBuffer, typeClassBuffer]);
  }

  private answerToBuffer(answer: DNSRecord): Buffer {
    const nameBuffer = this.nameToBuffer(answer.name);
    const fixedBuffer = Buffer.alloc(10);
    fixedBuffer.writeUInt16BE(answer.type, 0);
    fixedBuffer.writeUInt16BE(answer.cls, 2);
    fixedBuffer.writeUInt32BE(answer.ttl, 4);
    fixedBuffer.writeUInt16BE(answer.rdlength, 8);
    return Buffer.concat([nameBuffer, fixedBuffer, answer.rdata]);
  }

  setRcode(rcode: number): void {
    this.flags = (this.flags & 0xFFF0) | (rcode & 0x0F);
  }

  setFlags(flags: number): void {
    this.flags = flags;
    this.opcode = (flags >> 11) & 0xF;
  }

  getFlags(): number {
    return this.flags;
  }
}