// pages/create-order.js
import { useRouter } from 'next/router';
import CreateOrderForm from '../components/CreateOrderForm';
import {useAppContext} from '@/context/AppContext'; // Import the useAppContext function
import { sha256 } from '@noble/hashes/sha256';
import { schnorr } from '@noble/curves/secp256k1';
import { useEffect } from 'react';
import { useState } from 'react';
import { useNDK } from "@nostr-dev-kit/ndk-react";

const signBody = (data, privateKey) => {
  const sortedBodyValues = Object.values(data).sort();
  const BodyValuesString = sortedBodyValues.join('');
  const signature = schnorr.sign(sha256(BodyValuesString), privateKey);
  return Buffer.from(signature).toString('hex');
}


export default function CreateOrderPage() {
  const router = useRouter();
  const { pubkey, secretKey } = useAppContext();
  const {  ndk } = useNDK()

  const [signature, setSignature] = useState('');
  const [signatureValid, setSignatureValid] = useState(false);



  useEffect(() => {
    if (!signature || signature === '') return;
    const sortedBodyValues = Object.values( {
      pubkey,
      message: 'Hello world',
    }).sort();
    const bodyValuesString = sortedBodyValues.join('');
    const valid = schnorr.verify(signature, sha256(bodyValuesString), pubkey);
    console.log('Signature valid:', valid);
    setSignatureValid(valid);
  }, [signature]);

  const handleOrderCreated = (order) => {
    router.push(`/orders/${order.order_id}`);
  };

  useEffect(() => {
    if (secretKey) {
      const data = {
        pubkey,
        message: 'Hello world',
      };
      const signature = signBody(data, secretKey);
      setSignature(signature);
    }
  }, [secretKey]);
  return (
    <div>
      <h1>Create Order</h1>
      <h2>Pubkey: {pubkey}</h2>
      <h2>SecretKey: {secretKey}</h2>
      <h2>message: Hello world</h2>
      <h2>Signature: {signature}</h2>
      <h2>Signature valid: {signatureValid? 'yes' : 'false'}</h2>
      <CreateOrderForm onOrderCreated={handleOrderCreated} />
    </div>
  );
}
