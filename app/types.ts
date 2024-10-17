export interface DNSQuestion {
  name: string;
  qtype: number;
  qclass: number;
}
export interface DNSRecord {
  name: string;
  type: number;
  cls: number;
  ttl: number;
  rdlength: number;
  rdata: Buffer;
}