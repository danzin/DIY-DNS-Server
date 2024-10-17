import * as dgram from "dgram";

import { argv } from "process";
import { DNSRecord, DNSQuestion } from "./types";
import { DNSMessage } from "./dnsMessage";
import { handleDNSQuery } from "./utils";

const PORT = 2053;

const udpSocket: dgram.Socket = dgram.createSocket('udp4');
const [, , , resolverArg] = argv;
const [resolverIp, resolverPort] = resolverArg.split(':');
const RESOLVER_PORT = parseInt(resolverPort, 10);



udpSocket.on('message', async (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
  try {
  const query = new DNSMessage(data);
    const response = await handleDNSQuery(query, RESOLVER_PORT, resolverIp);
    const responseBuffer = response.toBuffer();
    udpSocket.send(responseBuffer, remoteAddr.port, remoteAddr.address);
  } catch (e) {
    console.error(`Error processing or sending data: ${e}`);
    // Send an error response to the client
    const errorResponse = new DNSMessage();
    errorResponse.packetId = data.readUInt16BE(0);
    errorResponse.flags = 0x8182; // Response + Server Failure
    const errorBuffer = errorResponse.toBuffer();
    udpSocket.send(errorBuffer, remoteAddr.port, remoteAddr.address);}
});
udpSocket.bind(PORT, () => {

  console.log(`[${new Date().toISOString()}] Socket bound to 0.0.0.0:${PORT}`);
});


