import { DNSHeader } from "./header";
import { DNSQuestion } from "./question";
import { DNSAnswer } from "./answer";

export class DNSMessage {
  header!: DNSHeader;
  questions: DNSQuestion[] = [];
  answers: DNSAnswer[] = [];

  fromBuffer(buffer: Buffer): DNSMessage {
    this.header = new DNSHeader();
    this.header.fromBuffer(buffer);

    let offset = 12; // Start after the header
    for (let i = 0; i < this.header.qdCount; i++) {
      const question = new DNSQuestion();
      offset = question.fromBuffer(buffer, offset);
      this.questions.push(question);
    }

    return this;
  }

  toBuffer(): Buffer {
    const headerBuffer = this.header.toBuffer();
    let questionBuffers = Buffer.concat(this.questions.map(q => q.toBuffer()));
    let answerBuffers = Buffer.concat(this.answers.map(a => a.toBuffer()));

    return Buffer.concat([headerBuffer, questionBuffers, answerBuffers]);
  }

  createResponse(): void {
    this.header.qr = true;
    this.header.anCount = this.questions.length;

    // Create an answer for each question
    this.questions.forEach(question => {
      const answer = new DNSAnswer();
      answer.fromQuestion(question);
      this.answers.push(answer);
    });
  }
}