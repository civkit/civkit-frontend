import { sha256 } from '@noble/hashes/sha256';
import { schnorr } from '@noble/curves/secp256k1';


export const signBody = (data: any, privateKey: Uint8Array): string => {
  const sortedBodyValues = Object.values(data).sort();
  const BodyValuesString = sortedBodyValues.join('');
  const signature = schnorr.sign(sha256(BodyValuesString), privateKey);
  return Buffer.from(signature).toString('hex');
}