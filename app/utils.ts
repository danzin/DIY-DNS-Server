/**
 * Function encoding domain names into DNS Label format. 
 * 
 * The DNS label format is a sequence of labels where each label is prefixed by its length.
 * The sequence is terminated by a zero-length label (0x00).
 * @param {string} name - The domain name to encode (e.g., "example.com").

 * @returns {Uint8Array} - The encoded domain name in DNS label format. 
 */
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

  // Encode each part of the domain name
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

