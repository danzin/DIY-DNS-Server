import { encodeLabel } from "./utils";

interface AnswerOpts {
  name?: string;
  type?: number;
  class?: number;
  ttl?: number;
  dataLength?: number;
  data?: Buffer;

};

export default class DNSAnswer {
  name: string;
  type: number; // 16 bits (2 bytes)
  class: number; // 16 bits (2 bytes)
  ttl: number; // 32 bits (4 bytes)
  dataLength: number; // 16 bits (2 bytes)
  data: Buffer; // address or other data

  constructor(options: AnswerOpts = {}){
    this.name = options.name ?? "";
    this.type = options.type ?? 1;
    this.ttl = options.type ?? 0;
    this.class = options.class ?? 1;
    this.dataLength = options.dataLength ?? 4;
    this.data = options.data ?? Buffer.alloc(this.dataLength)
  
  };

  encode(): Uint8Array {

    //Encode name, init new buffer with length of name bytes + 10 (for type, class, ttl, and data length) + data length
    const nameBytes = encodeLabel(this.name);
    const buffer = new ArrayBuffer(nameBytes.length + 10 + this.data.length);

    //Easier to work with DataView
    const view = new DataView(buffer);

    //Set type, class, ttl, and data length and data to the buffer
    let offset = 0;

    for (const byte of nameBytes) {
      view.setUint8(offset++, byte);
    };
    view.setUint16(offset, this.type, false);
    offset += 2;

    view.setUint16(offset, this.class, false);
    offset += 2;
    
    view.setUint32(offset, this.ttl, false);
    offset += 4;
    
    view.setUint16(offset, this.dataLength, false);
    offset += 2;
    
    for (const byte of this.data) {
      view.setUint8(offset++, byte);
    };

    //Return new Uint8Array from the buffer
    return new Uint8Array(buffer);
  };
};

