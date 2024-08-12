
export const set16BitValueHeader = (array: Uint8Array, value: number, offset: number): void => {
  array[offset] = (value >> 8) & 0xff; //high byte
  array[offset + 1] = value & 0xff;   //low byte

}

export const set16BitValueQuestion = (view: DataView, value: number, offset: number): void => {
  view.setUint16(offset, value, false);
}