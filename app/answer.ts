import { encodeDomainName } from "./utils";
import { DNSQuestion } from "./question";

export class DNSAnswer {
  name: string;
  type: number;
  class: number;
  ttl: number;
  rdLength: number;
  rdata: Buffer;

  constructor() {
    this.name = '';
    this.type = 1; // A record
    this.class = 1; // IN
    this.ttl = 60; // TTL of 60 seconds
    this.rdLength = 4; // IPv4 address is 4 bytes
    this.rdata = Buffer.from([8, 8, 8, 8]); // Default to 8.8.8.8
  }

  fromQuestion(question: DNSQuestion) {
    this.name = question.name;
    this.type = question.type;
    this.class = question.class;
  }

  toBuffer(): Buffer {
    const nameBuffer = encodeDomainName(this.name);
    const buffer = Buffer.alloc(nameBuffer.length + 10 + this.rdata.length);
    nameBuffer.copy(buffer, 0);
    buffer.writeUInt16BE(this.type, nameBuffer.length);
    buffer.writeUInt32BE(this.ttl, nameBuffer.length + 4);
    buffer.writeUInt16BE(this.rdLength, nameBuffer.length + 8);
    this.rdata.copy(buffer, nameBuffer.length + 10);
    return buffer;
  }
}