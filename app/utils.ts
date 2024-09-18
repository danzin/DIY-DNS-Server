import { BufferOverunError } from "./errors";

export const readDomainName = (buffer: Buffer, offset: number): [string, number] => {
  let labels: string[] = [];
  let jumped = false; 
  let originalOffset = offset; 
  let pointerFollowed = false; 

  while (true) {
    const length = buffer[offset];

    // Check for compression pointer (0xC0 signifies pointer)
    if ((length & 0xC0) === 0xC0) {
      // Handle compression: the pointer is a 14-bit offset to another part of the message
      const pointerOffset = ((length & 0x3F) << 8) | buffer[offset + 1];

      if (!jumped) {
        originalOffset = offset + 2; // Only update originalOffset on first encounter of a pointer
      }

      // Jump to pointer offset
      offset = pointerOffset;
      jumped = true;

      // Don't endlessly follow pointers
      if (pointerFollowed) {
        throw new BufferOverunError("Too many DNS compression pointers");
      }
      pointerFollowed = true;
    } else if (length > 0) {
      // Regular label (length-prefixed)
      if (offset + 1 + length > buffer.length) {
        throw new BufferOverunError("Buffer overrun while reading domain name label");
      }

      labels.push(buffer.slice(offset + 1, offset + 1 + length).toString());
      offset += length + 1;
    } else {
      // null terminator === done reading the domain name
      if (!jumped) {
        originalOffset = offset + 1;
      }
      break;
    }
  }

  return [labels.join("."), originalOffset];
};


export const encodeDomainName = (domainName: string): Buffer => {
  const parts = domainName.split(".");
  
  // Calculate the total buffer size needed (length of each part + 1 for the length byte + 1 for the final 0 byte)
  const totalLength = parts.reduce((acc, part) => acc + part.length + 1, 1);
  
  const buffer = Buffer.alloc(totalLength);
  let offset = 0;

  for (const part of parts) {
    buffer.writeUInt8(part.length, offset); // Write length byte
    offset += 1;
    buffer.write(part, offset); // Write the label
    offset += part.length;
  }

  buffer.writeUInt8(0, offset); // Write the terminating 0x00 byte

  return buffer;
};

export const encodeLabel = (name: string): Uint8Array => {
  const parts = name.split(".");
  let nameBytesCnt = 0;

  for (const part of parts) {
    nameBytesCnt += part.length + 1; // +1 for the length byte
  }

  nameBytesCnt++; // +1 for the terminating 0x00 byte
  const buffer = new ArrayBuffer(nameBytesCnt);
  const view = new DataView(buffer);
  let offset = 0;

  for (const part of parts) {
    view.setUint8(offset++, part.length); // Set the length byte
    for (let i = 0; i < part.length; i++) {
      view.setUint8(offset++, part.charCodeAt(i)); // Set the character bytes
    }
  }

  view.setUint8(offset++, 0); // Set the terminating 0x00 byte
  // Return the encoded name as a Uint8Array
  return new Uint8Array(buffer);
};

