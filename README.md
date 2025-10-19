# DIY DNS Server

A DNS server implementation in TypeScript that handles DNS queries by forwarding them to a configurable resolver.

## Features

- **DNS Protocol Parser** - Full implementation of DNS message parsing (questions, answers, authority, additional records)
- **Compression Support** - Handles DNS name compression/decompression with pointer jumping
- **UDP Socket Handling** - Async/await UDP communication with timeout and error handling
- **Query Forwarding** - Proxies DNS queries to upstream resolvers while preserving packet IDs and flags
- **Debug Logging** - Detailed logging of all DNS operations

## Tech Stack

- TypeScript
- Node.js dgram (UDP)
- Bun runtime

## How It Works

1. Listens for DNS queries on UDP port 2053
2. Parses incoming DNS messages (header, questions, records)
3. Forwards queries to specified upstream resolver
4. Parses response and sends back to original client
5. Handles errors with proper SERVFAIL responses

## Running Locally
```bash
bun install
bun run dev --resolver 8.8.8.8:53
```

Test with `dig`:
```bash
dig @127.0.0.1 -p 2053 google.com
```

## Architecture

- `main.ts` - UDP server setup and request handling
- `dnsMessage.ts` - DNS protocol parser/serializer
- `utils.ts` - Query forwarding logic
- `types.ts` - Type definitions

## Example Query Flow
```
Client → DNS Server (port 2053)
         ↓
         Parse DNS query
         ↓
         Forward to resolver (e.g., 8.8.8.8:53)
         ↓
         Receive response
         ↓
         Preserve original packet ID
         ↓
Client ← Send response back
```
