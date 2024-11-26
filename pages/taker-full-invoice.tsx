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

const TakerFullInvoice: React.FC<TakerFullInvoiceProps> = ({ orderId, initialFullInvoice }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullInvoice, setFullInvoice] = useState(initialFullInvoice);

  useInvoiceStatusCheck(fullInvoice, (updatedInvoice) => {
    setFullInvoice(updatedInvoice);
  });

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

  if (loading) {
    return (
      <div className='flex items-center justify-center'>
        <Spinner /> Loading...
      </div>
    );
  }

  return (
    <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
      <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>
        Full Invoice Details
      </h2>
      
      <div className='mb-4'>
        <label className='mb-2 block font-bold text-gray-700'>Invoice:</label>
        <div className='break-words rounded bg-gray-100 p-2'>
          <p className='text-xs'>{fullInvoice?.bolt11}</p>
        </div>
      </div>
      
      <div className='my-4 flex justify-center'>
        <QRCode value={fullInvoice?.bolt11} size={200} />
      </div>

      <div className='mt-4 space-y-2'>
        <p><strong>Invoice ID:</strong> {fullInvoice?.invoice_id}</p>
        <p><strong>Order ID:</strong> {fullInvoice?.order_id}</p>
        <p><strong>Amount:</strong> {parseInt(fullInvoice?.amount_msat) / 1000} sats</p>
        <p><strong>Description:</strong> {fullInvoice?.description}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`font-bold ${
            fullInvoice?.status === 'paid' ? 'text-green-600' : 'text-orange-500'
          }`}>
            {fullInvoice?.status}
          </span>
        </p>
        <p><strong>Created At:</strong> {new Date(fullInvoice?.created_at).toLocaleString()}</p>
        <p><strong>Expires At:</strong> {new Date(fullInvoice?.expires_at).toLocaleString()}</p>
        <p><strong>Payment Hash:</strong> {fullInvoice?.payment_hash}</p>
      </div>

      {fullInvoice?.status !== 'paid' && (
        <button
          onClick={() => createAndFetchTakerFullInvoice(orderId)}
          className='mt-6 w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600'
        >
          Check Invoice Status
        </button>
      )}

      {fullInvoice?.status === 'paid' && (
        <div className='mt-4 text-center text-green-600 font-bold'>
          Invoice has been paid!
        </div>
      )}
    </div>
  );
};

const useInvoiceStatusCheck = (invoice, onStatusChange) => {
  useEffect(() => {
    if (!invoice?.payment_hash || invoice.status === 'paid') return;

    const checkStatus = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-full-invoice/${invoice.order_id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.data.invoice.status !== invoice.status) {
          onStatusChange(response.data.invoice);
        }
      } catch (error) {
        console.error('Error checking invoice status:', error);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [invoice?.payment_hash, invoice?.status]);
};

export default TakerFullInvoice;
