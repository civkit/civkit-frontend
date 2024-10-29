// @ts-expect-error TS(2792): Cannot find module '@noble/hashes/sha256'. Did you... Remove this comment to see the full error message
import { sha256 } from '@noble/hashes/sha256';
// @ts-expect-error TS(2792): Cannot find module '@noble/curves/secp256k1'. Did ... Remove this comment to see the full error message
import { schnorr } from '@noble/curves/secp256k1';

export const signBody = (data: any, privateKey: Uint8Array): string => {
  const sortedBodyValues = Object.values(data).sort();
  const BodyValuesString = sortedBodyValues.join('');
  const signature = schnorr.sign(sha256(BodyValuesString), privateKey);
  return Buffer.from(signature).toString('hex');
};
