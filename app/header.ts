import { set16BitValueHeader } from "./helpers";

interface HeaderOpts { 
  packetId?: number;
  isResponse?: boolean;
  opCode?: number;
  isAuthoritativeAnswer?: boolean;
  isTruncated?: boolean;
  isRecursionDesired?: boolean;
  isRecursionAvailable?: boolean;
  responseCode?: number;
  questionCount?: number;
  answerRecordCount?: number;
  authorityRecordCount?: number;
  additionalRecordCount?: number;

}

export default class DNSHeader {
  packetID: number; //16 bits
  isResponse: boolean; //1 bit
  opCode: number; //4 bits
  isAuthoritativeAnswer: boolean; //1 bit
  isTruncated: boolean; //1 bit
  isRecursionDesired: boolean;  //1 bit
  isRecursionAvailable: boolean; //1 bit
  responseCode: number; //4 bits
  questionCount: number; //16 bits
  answerRecordCount: number; //16 bits
  authorityRecordCount: number; //16 bits
  additionalRecordCount: number; //16 bits


  constructor ( options: HeaderOpts = {} ) {
    this.packetID = options.packetId ?? 1234;
    this.isResponse = options.isResponse ?? false;
    this.opCode = options.opCode ?? 0;
    this.isAuthoritativeAnswer = options.isAuthoritativeAnswer ?? false;
    this.isTruncated = options.isTruncated ?? false;
    this.isRecursionDesired = options.isRecursionDesired ?? false;
    this.isRecursionAvailable = options.isRecursionAvailable ?? false;
    this.responseCode = options.responseCode ?? 0;
    this.questionCount = options.questionCount ?? 0;
    this.answerRecordCount = options.answerRecordCount ?? 0;
    this.authorityRecordCount = options.authorityRecordCount ?? 0;
    this.additionalRecordCount = options.additionalRecordCount ?? 0;
  }

  /**
   * Encodes the DNS header into a Uint8Array.
   *
   * The encoded array contains the packet ID, flags, and counts.
   * The flags include QR, OPCODE, AA, TC, RD, RA, Z, and RCODE.
   * The counts include QDCOUNT, ANCOUNT, NSCOUNT, and ARCOUNT.
   *
   * @return {Uint8Array} The encoded DNS header.
   */
  encode(): Uint8Array {

    const byteArray = new Uint8Array(12); //Create new typed array with length of 12 bytes

    //packetID - divided in two and stored in the first two bytes of the byte array
    set16BitValueHeader(byteArray,this.packetID, 0);

    /**
     * Flags QR, OPCODE, AA, TC, RD are mostly single bits, 
     * packed into a single byte of the byte array: byteArray[2]
     * OPCODE is 4 bits
     */
    let byte = 0;
    if (this.isResponse) byte |= 0b10000000; // isResponse
    byte |= (this.opCode << 3) & 0b01111000; // OPCODE
    if (this.isAuthoritativeAnswer) byte |= 0b00000100; // AA
    if (this.isTruncated) byte |= 0b00000010; // TC
    if (this.isRecursionDesired) byte |= 0b00000001; // RD
    byteArray[2] = byte;

    // Flags RA, Z, RCODE are packed into another single byte in the byte array: byteArray[3]
    byte = 0;
    if (this.isRecursionAvailable) byte |= 0b10000000; // RA
    // Reserverd Z is always 0 
    byte |= this.responseCode & 0b00001111; // RCODE
    byteArray[3] = byte;
    
    /**
     * Counts are each 16 bit fields
     * each count is split into low and high byte
     * and stored in the appropriate position in the byte array
     */

    // QDCOUNT
    set16BitValueHeader(byteArray, this.questionCount, 4);

    // ANCOUNT
    set16BitValueHeader(byteArray, this.questionCount, 6);
    
    // NSCOUNT
    set16BitValueHeader(byteArray, this.questionCount, 8);

    // ARCOUNT
    set16BitValueHeader(byteArray, this.questionCount, 10);

    return byteArray;
  };

  /**
   * Creates a DNSHeader object from a given Buffer.
   *
   * This function reads the Buffer and extracts the necessary information to
   * populate the DNSHeader object's properties, including packetID, flags, and
   * various counts.
   *
   * @param {Buffer} buffer - The Buffer to read from.
   * @return {DNSHeader} The populated DNSHeader object.
   */
  fromBuffer(buffer: Buffer) {

    this.packetID = buffer.readUInt16BE(0);
    const byte2 = buffer.readUInt8(2);

    this.isResponse = (byte2 & 0b10000000) !== 0;
    this.opCode = (byte2 & 0b01111000) >> 3;
    this.isAuthoritativeAnswer = (byte2 & 0b00000100) !== 0;
    this.isTruncated = (byte2 & 0b00000010) !== 0;
    this.isRecursionDesired = (byte2 & 0b00000001) !== 0;

    const byte3 = buffer.readUInt8(3);
    this.isRecursionAvailable = (byte3 & 0b10000000) !== 0;
    this.responseCode = byte3 & 0b00001111;

    this.questionCount = buffer.readUInt16BE(4);
    this.answerRecordCount = buffer.readUInt16BE(6);
    
    this.authorityRecordCount = buffer.readUInt16BE(8);
    this.additionalRecordCount = buffer.readUInt16BE(10);
    
    return this;
1
  };
}
