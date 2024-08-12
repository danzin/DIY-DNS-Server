import DNSAnswer from "./answer";
import DNSHeader from "./header";
import DNSQuestion from "./question";

export default class DNSMessage {
  header: DNSHeader;
  question: DNSQuestion;
  answer: DNSAnswer;

  constructor(header: DNSHeader, question: DNSQuestion, answer: DNSAnswer) {
    this.header = header;
    this.question = question;
    this.answer = answer;
  }
  /**
   * Encodes the DNS message into a Uint8Array.
   *
   * This function takes the header, question, and answer parts of the DNS message,
   * encodes each part separately, and then combines them into a single Uint8Array.
   *
   * @return {Uint8Array} The encoded DNS message.
   */
  encode(): Uint8Array {
    const headerBytes = this.header.encode();
    const questionBytes = this.question.encode();
    const answerBytes = this.answer.encode();

    const messageBytes = new Uint8Array(
      headerBytes.length + questionBytes.length + answerBytes.length
    );

    messageBytes.set(headerBytes);
    messageBytes.set(questionBytes, headerBytes.length);
    messageBytes.set(answerBytes, headerBytes.length + questionBytes.length);
    return messageBytes;
  }
  
  /**
   * Creates a DNSMessage object from a given Buffer.
   *
   * This function reads the Buffer and extracts the necessary information to
   * populate the DNSMessage object's properties.
   *
   * @param {Buffer} buffer - The Buffer to read from.
   * @return {DNSMessage} The populated DNSMessage object.
   */
  fromBuffer(buffer: Buffer): DNSMessage {
    this.header.fromBuffer(buffer);
    return this;
  }
}