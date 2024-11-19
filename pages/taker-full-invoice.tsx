import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { Spinner } from '../components';

const createAndFetchTakerFullInvoice = async (orderId: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/taker-full-invoice/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    console.log('Taker full invoice response:', response.data);
    return response.data.invoice;
  } catch (error) {
    console.error('Error creating or fetching taker full invoice:', error);
    throw error;
  }
};

const TakerFullInvoice = ({ orderId, initialFullInvoice }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullInvoice, setFullInvoice] = useState(initialFullInvoice);

  console.log('Order ID:', orderId);

  useEffect(() => {
    if (!fullInvoice && orderId) {
      createAndFetchTakerFullInvoice(orderId)
        .then((invoice) => {
          setFullInvoice(invoice);
          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId, fullInvoice]);

  return (
    <div>
      {loading ? (
        <div className='flex flex-row items-center justify-center h-screen gap-2'>
          Loading... <Spinner />
        </div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : !fullInvoice ? (
        <div>No invoice data available.</div>
      ) : (
        <div>
          <h1>Full Taker Invoice Details</h1>
          <div>
            <p>Invoice (Full):</p>
            <div>
              <p>{fullInvoice.bolt11}</p>
            </div>
          </div>
          <div>
            <QRCode value={fullInvoice.bolt11} />
          </div>
          <div>
            <p>Invoice ID: {fullInvoice.invoice_id}</p>
            <p>Order ID: {fullInvoice.order_id}</p>
            <p>Amount: {parseInt(fullInvoice.amount_msat) / 1000} sats</p>
            <p>Description: {fullInvoice.description}</p>
            <p>Status: {fullInvoice.status}</p>
            <p>Created At: {new Date(fullInvoice.created_at).toLocaleString()}</p>
            <p>Expires At: {new Date(fullInvoice.expires_at).toLocaleString()}</p>
            <p>Payment Hash: {fullInvoice.payment_hash}</p>
          </div>
          <button onClick={() => createAndFetchTakerFullInvoice(orderId)}>
            Refresh Invoice Status
          </button>
        </div>
      )}
    </div>
  );
};

export default TakerFullInvoice;
