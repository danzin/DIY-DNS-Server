import * as dgram from "dgram";
import {DNSMessage} from "./message";

const address = "127.0.0.1";
const port = 2053
const udpSocket: dgram.Socket = dgram.createSocket("udp4");

udpSocket.bind(port, address);
console.log(`Socket listening on ${address}:${port}...`);

udpSocket.on("message", (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);

        const message = new DNSMessage();
        message.fromBuffer(data);
        if (message.header.opcode !== 0) {
            message.header.rcode = 4;
          } else {
            message.header.rcode = 0; 
          }
        message.createResponse();

        const response = message.toBuffer();
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error processing DNS message: ${e}`);
    }
});
