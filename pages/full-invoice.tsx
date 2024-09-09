import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const FullInvoice = () => {
  const router = useRouter();
  const { orderid: rawOrderId, orderId: rawOrderIdCamel } = router.query;
  const orderId = typeof rawOrderId === 'string' ? rawOrderId.toLowerCase() : 
                  typeof rawOrderIdCamel === 'string' ? rawOrderIdCamel.toLowerCase() : 
                  undefined;
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
      console.log('Token:', localStorage.getItem('token'));
      const response = await axios.get(`http://localhost:3000/api/full-invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
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
      console.error('Error details:', error.response?.data);
      setError(`Failed to fetch full invoice: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncInvoice = async () => {
    if (!orderId) return; // Add this check
    try {
      await axios.post(`http://localhost:3000/api/sync-invoice/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      await fetchFullInvoice();
    } catch (error) {
      console.error('Error syncing invoice:', error);
      setError(`Failed to sync invoice: ${error.response?.data?.error || error.message}`);
    }
  };

  useEffect(() => {
    console.log('Current orderId:', orderId);
    console.log('Router query:', router.query);
    if (router.isReady && orderId) {
      fetchFullInvoice();
    } else {
      console.log('Router not ready or orderId not available');
    }
  }, [router.isReady, orderId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token available:', !!token);
  }, []);

  useEffect(() => {
    let intervalId;
    if (fullInvoice && fullInvoice.status !== 'paid') {
      intervalId = setInterval(fetchFullInvoice, 5000); // Check every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fullInvoice, orderId]); // Add orderId to the dependency array

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">{error}</div>;
  }

  if (!fullInvoice) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">No invoice data available.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Full Invoice Details</h1>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Invoice (Full):</label>
          <div className="bg-gray-100 p-2 rounded break-words">
            <p className="text-xs">{fullInvoice.bolt11}</p>
          </div>
        </div>
        <div className="flex justify-center my-4">
          <QRCode value={fullInvoice.bolt11} />
        </div>
        <div className="mt-4">
          <p><strong>Invoice ID:</strong> {fullInvoice.invoice_id}</p>
          <p><strong>Order ID:</strong> {fullInvoice.order_id}</p>
          <p><strong>Amount:</strong> {parseInt(fullInvoice.amount_msat) / 1000} sats</p>
          <p><strong>Amount Received:</strong> {fullInvoice.amount_received_msat ? parseInt(fullInvoice.amount_received_msat) / 1000 : 0} sats</p>
          <p><strong>Description:</strong> {fullInvoice.description}</p>
          <p><strong>Status:</strong> {fullInvoice.status}</p>
          <p><strong>Payment Hash:</strong> {fullInvoice.payment_hash}</p>
        </div>
        <button 
          onClick={syncInvoice} 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Sync Invoice
        </button>
      </div>
    </div>
  );
};

export default FullInvoice;