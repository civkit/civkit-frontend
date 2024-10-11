import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { Spinner } from '../components';

const FullInvoice = () => {
  const router = useRouter();
  const { orderid: rawOrderId, orderId: rawOrderIdCamel } = router.query;
  const orderId =
    typeof rawOrderId === 'string'
      ? rawOrderId.toLowerCase()
      : typeof rawOrderIdCamel === 'string'
        ? rawOrderIdCamel.toLowerCase()
        : undefined;
  const [fullInvoice, setFullInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFullInvoice = async () => {
    if (!orderId) {
      console.log('No orderId available, skipping fetch');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setError(null);
      console.log(`Fetching full invoice for order ID: ${orderId}`);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/full-invoice/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Full invoice response:', response.data);
      if (response.data && response.data.invoice) {
        setFullInvoice(response.data.invoice);
        console.log('Full invoice set:', response.data.invoice);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching full invoice:', error);
      setError(
        `Failed to fetch full invoice: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const checkFullInvoice = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-full-invoice/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Check full invoice response:', response.data);
      if (response.data && response.data.status) {
        setFullInvoice((prevInvoice) => ({
          ...prevInvoice,
          status: response.data.status,
        }));
      }
    } catch (error) {
      console.error('Error checking full invoice:', error);
      setError(
        `Failed to check full invoice: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && orderId) {
      fetchFullInvoice();
    }
  }, [router.isReady, orderId]);

  useEffect(() => {
    let intervalId;
    if (fullInvoice && fullInvoice.status !== 'paid') {
      intervalId = setInterval(checkFullInvoice, 5000); // Check every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fullInvoice, orderId]);

  return (
    <div className='flex h-full w-full max-w-md flex-col gap-4 rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
      {loading ? (
        <div className='flex items-center justify-center gap-2 text-gray-500'>
          <Spinner /> Loading...
        </div>
      ) : error ? (
        <div className='text-center text-red-500'>
            {error}
          </div>
        ) : !fullInvoice ? (
          <div className='text-center text-gray-500'>
            No invoice data available.
          </div>
        ) : (
          <>
            <h1 className='mb-6 text-center text-2xl font-bold text-gray-600'>
              Full Invoice Details
            </h1>
            <div className='mb-4'>
              <label className='mb-2 block font-bold text-gray-700'>
                Invoice (Full):
              </label>
              <div className='break-words rounded bg-gray-100 p-2'>
                <p className='text-xs'>{fullInvoice.bolt11}</p>
              </div>
            </div>
            <div className='my-4 flex justify-center'>
              <QRCode value={fullInvoice.bolt11} />
            </div>
            <div className='mt-4'>
              <p>
                <strong>Invoice ID:</strong> {fullInvoice.invoice_id}
              </p>
              <p>
                <strong>Order ID:</strong> {fullInvoice.order_id}
              </p>
              <p>
                <strong>Amount:</strong> {parseInt(fullInvoice.amount_msat) / 1000}{' '}
                sats
              </p>
              <p>
                <strong>Description:</strong> {fullInvoice.description}
              </p>
              <p>
                <strong>Status:</strong> {fullInvoice.status}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {new Date(fullInvoice.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Expires At:</strong>{' '}
                {new Date(fullInvoice.expires_at).toLocaleString()}
              </p>
              <p>
                <strong>Payment Hash:</strong> {fullInvoice.payment_hash}
              </p>
            </div>
            <button
              onClick={checkFullInvoice}
              className='mt-4 w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700'
            >
              Check Invoice Status
            </button>
          </>
        )}
    </div>
  );
};

export default FullInvoice;
