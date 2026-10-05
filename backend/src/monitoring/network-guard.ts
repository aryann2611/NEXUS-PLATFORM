import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { BlockList, isIP, type LookupFunction } from "node:net";

// Loopback, private, link-local (cloud metadata), CGNAT, multicast and reserved ranges.
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

/** The IPv4 address inside an IPv4-mapped IPv6 address (::ffff:a.b.c.d), if it is one. */
function mappedIPv4(address: string): string | null {
  const normalized = new URL(`http://[${address}]`).hostname.slice(1, -1); // e.g. ::ffff:7f00:1
  const match = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!match) return null;
  const [high, low] = [parseInt(match[1], 16), parseInt(match[2], 16)];
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return blocked.check(address, "ipv4");
  if (family !== 6) return false;
  // Don't add ::ffff:0:0/96 to the BlockList: Node matches it against every IPv4 address.
  const mapped = mappedIPv4(address);
  return mapped ? blocked.check(mapped, "ipv4") : blocked.check(address, "ipv6");
}

export class BlockedTargetError extends Error {
  readonly code = "EBLOCKED";
}

/**
 * A `lookup` for http.request that refuses hosts resolving to private addresses. Validating the
 * address actually connected to (not a separate pre-check) also defeats DNS rebinding.
 */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error, "", 0);
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
      return callback(new BlockedTargetError(`${hostname} resolves to a private or internal address`), "", 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
};
