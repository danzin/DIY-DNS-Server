import * as dgram from "dgram";
import { argv } from "process";
import { DNSMessage } from "./dnsMessage";
import { handleDNSQuery } from "./utils";

const client = '127.0.0.1'
const PORT = 2053;
const udpSocket: dgram.Socket = dgram.createSocket('udp4');

const [, , , resolverArg] = argv;
const [resolverIp, resolverPort] = resolverArg.split(':');
const RESOLVER_PORT = parseInt(resolverPort, 10);

const clientInfoMap = new WeakMap<DNSMessage, {address: string, port: number}>();

function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

udpSocket.on('message', async (data: Buffer, remoteInfo: dgram.RemoteInfo) => {
  const originalClient = {
    address: remoteInfo.address.trim(),  
    port: remoteInfo.port
  };

  debugLog(`New request from client ${originalClient.address}:${originalClient.port}`);
  debugLog(`originalClient:`, originalClient);
  try {
    const query = new DNSMessage(data);
    clientInfoMap.set(query, originalClient);

    debugLog(`Processing query:`, {
      id: query.packetId,
      flags: query.flags.toString(16),
      questions: query.questions,
      clientInfo: `${originalClient.address}:${originalClient.port}`
    });

    const response = await handleDNSQuery(query, RESOLVER_PORT, resolverIp);
    const clientInfo = clientInfoMap.get(query);
    
    if (!clientInfo) {
      throw new Error('Lost client information');
    }

    debugLog(`Got response:`, {
      id: response.packetId,
      flags: response.flags.toString(16),
      answers: response.answers.length,
      authority: response.authority.length,
      additional: response.additional.length,
      originalClient: `${originalClient.address}:${originalClient.port}`
    });

    const responseBuffer = response.toBuffer();
    
    debugLog(`Sending ${responseBuffer.length} bytes back to client ${originalClient.address}:${originalClient.port}`);
    
    await new Promise<void>((resolve, reject) => {
      udpSocket.send(
        responseBuffer,
        clientInfo.port,
        client,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    clientInfoMap.delete(query);

  } catch (e) {
    debugLog(`Error processing query from ${originalClient.address}:${originalClient.port}: ${e}`);
    
    try {
      const errorResponse = new DNSMessage();
      errorResponse.packetId = data.readUInt16BE(0);
      errorResponse.flags = 0x8182; 
      const errorBuffer = errorResponse.toBuffer();
      
      await new Promise<void>((resolve, reject) => {
        udpSocket.send(errorBuffer, originalClient.port, originalClient.address, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (sendError) {
      debugLog(`Failed to send error response to ${originalClient.address}:${originalClient.port}: ${sendError}`);
    }
  }
});

udpSocket.bind(PORT, '0.0.0.0', () => {
  debugLog(`DNS Server bound to 0.0.0.0:${PORT}`);
});