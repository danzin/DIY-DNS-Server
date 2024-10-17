
import { DNSQuestion, DNSRecord } from "./types";
import { DNSMessage } from "./dnsMessage";
import * as dgram from 'dgram';

export function forwardDNSQuery(query: Buffer, RESOLVER_PORT: number, resolverIp: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    client.send(query, RESOLVER_PORT, resolverIp, (err) => {
      if (err) {
        client.close();
        reject(err);
      }
    });
    client.on('message', (msg) => {
      client.close();
     resolve(msg);
    });
    client.on('error', (err) => {
      client.close();
      reject(err);
    });
  });
}

export async function handleDNSQuery(query: DNSMessage, RESOLVER_PORT: number, resolverIp: string): Promise<DNSMessage> {
  const response = new DNSMessage();
  response.packetId = query.packetId;
  response.questions = query.questions;
  // Preserve the opcode and set QR bit
  const responseFlags = (query.getFlags() & 0x7800) | 0x8000 | (query.flags & 0x0100);
  response.setFlags(responseFlags);
  if (query.opcode === 0) { // QUERY
    response.flags |= 0x0080; // Set RA bit for QUERY
    if (query.questions.length > 1) {
      // Handle multiple questions
      const responses = await Promise.all(query.questions.map(async (q) => {
        const singleQuery = new DNSMessage();
        singleQuery.packetId = query.packetId;
        singleQuery.setFlags(query.getFlags());
        singleQuery.questions = [q];
        const forwardedResponse = await forwardDNSQuery(singleQuery.toBuffer(), RESOLVER_PORT, resolverIp);
        return new DNSMessage(forwardedResponse);
      }));
      response.answers = responses.flatMap(r => r.answers);
    } else {
      const forwardedResponse = await forwardDNSQuery(query.toBuffer(), RESOLVER_PORT, resolverIp);
      const parsedResponse = new DNSMessage(forwardedResponse);
      response.answers = parsedResponse.answers;
    }
  } else {
    // For IQUERY and other opcodes
    response.setRcode(4); // Not Implemented
  }
  return response;
}