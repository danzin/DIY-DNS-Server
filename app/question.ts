import { set16BitValueQuestion } from "./helpers";

interface QuestionOptions {
  name?: string;
  type?: number;
  class?: number;
}

export default class DNSQuestion {
  name: string;
  type: number;
  class: number;

  constructor(options: QuestionOptions = {}) {
    this.name = options.name ?? "";
    this.type = options.type ?? 1;
    this.class = options.class ?? 1;

  }

  encode(): Uint8Array {
    const parts = this.name.split(".");

    // Calculating the byte length of the buffer from the parts of the name
    let nameBytesCnt = 0;
    for (const part of parts) {
      nameBytesCnt += part.length + 1;
    }
    nameBytesCnt++; // for the last 0x00

    // Initializing the buffer with extra 4 bytes for type and class fields
    const buffer = new ArrayBuffer(nameBytesCnt + 4);
    // Data view for easier reading and writing of the buffer
    const view = new DataView(buffer);


    let offset = 0;
    for (const part of parts) {
      view.setUint8(offset++, part.length);
      for (let i = 0; i < part.length; i++) {
        view.setUint8(offset++, part.charCodeAt(i));
      }
    }
    view.setUint8(offset++, 0);
    set16BitValueQuestion(view, this.type, offset);
    offset += 2;
    set16BitValueQuestion(view, this.class, offset);
    return new Uint8Array(buffer);
  }
}