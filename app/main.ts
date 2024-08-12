import * as dgram from "dgram";
import DNSHeader  from "./header";
import DNSQuestion from "./question";
import DNSMessage from "./message";
import DNSAnswer from "./answer";

const address = "127.0.0.1";
const port = 2053
const udpSocket: dgram.Socket = dgram.createSocket("udp4");

udpSocket.bind(port, "127.0.0.1");
console.log(`Socket listening on ${address}:${port}...`);

udpSocket.on("message", (data: Buffer, remoteAddr: dgram.RemoteInfo) => {
    try {
        console.log(`Received data from ${remoteAddr.address}:${remoteAddr.port}`);

        const message = new DNSMessage(
          new DNSHeader(),
          new DNSQuestion({
            name: 'codecrafters.io',
            class: 1,
            type: 1,
          }),
          new DNSAnswer({
            name: "codecrafters.io",
            class: 1,
            type: 1,
            ttl: 60,
          })
        );
        message.fromBuffer(data);

        message.header.isResponse = true; // This is a response
        message.header.isRecursionAvailable = false; // Recursion not available
        message.header.responseCode = message.header.opCode === 0 ? 0 : 4;
        message.header.answerRecordCount = 1;

        const response = Buffer.from(message.encode());
        console.log(response)
        udpSocket.send(response, remoteAddr.port, remoteAddr.address);
    } catch (e) {
        console.log(`Error sending data: ${e}`);
    }
});
