// We cast into a boolean the beginning of user's compressed public key, because it only can be started with 02 or 03
export function castPubKeyPrefixToBoolean(prefix: string): boolean {
  return prefix === "03";
}

export function castCompressedPubKeyFromContractStore(pubKeyPrefix: boolean, pubKey: string): string {
  return castPubKeyPrefixToString(pubKeyPrefix) + pubKey.substr(2, pubKey.length);
}

export function castPubKeyPrefixToString(prefix: boolean): string {
  return prefix ? "03" : "02";
}
