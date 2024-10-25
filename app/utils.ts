import { DNSMessage } from "./dnsMessage";
import * as dgram from "dgram";

export async function handleDNSQuery(
  query: DNSMessage,
  RESOLVER_PORT: number,
  resolverIp: string
): Promise<DNSMessage> {
  console.log('---Executing handleDNSQuery----')
  const queryBuffer = query.toBuffer();
  
  const forwardedResponse = await forwardDNSQuery(queryBuffer, RESOLVER_PORT, resolverIp);
  
  const response = new DNSMessage(forwardedResponse);
  
  response.packetId = query.packetId;
  
  // Set response flags
  response.flags = (response.flags & ~0x7800) | 
                  (query.flags & 0x7800) |     
                  0x8000 |                    
                  0x0080;                     
  console.log('---End of handleDNSQuery----')
  return response;
}

function forwardDNSQuery(query: Buffer, RESOLVER_PORT: number, resolverIp: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    console.log('---Executing forwardDNSQuery----')
    const client = dgram.createSocket('udp4');
    
    const timeout = setTimeout(() => {
      client.close();
      reject(new Error('DNS query timed out'));
    }, 2000);

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.close();
      reject(err);
    });

    client.on('message', (msg) => {
      clearTimeout(timeout);
      client.close();
      resolve(msg);
    });

    client.send(query, RESOLVER_PORT, resolverIp, (err) => {
      if (err) {
        clearTimeout(timeout);
        client.close();
        reject(err);
      }
    });
    console.log('---End of forwardDNSQuery----')

  });
  
}