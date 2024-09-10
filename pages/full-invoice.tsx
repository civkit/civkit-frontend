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
      setError(`Failed to fetch full invoice: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkFullInvoice = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:3000/api/check-full-invoice/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Check full invoice response:', response.data);
      if (response.data && response.data.status) {
        setFullInvoice(prevInvoice => ({ ...prevInvoice, status: response.data.status }));
      }
    } catch (error) {
      console.error('Error checking full invoice:', error);
      setError(`Failed to check full invoice: ${error.response?.data?.error || error.message}`);
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
          <p><strong>Description:</strong> {fullInvoice.description}</p>
          <p><strong>Status:</strong> {fullInvoice.status}</p>
          <p><strong>Created At:</strong> {new Date(fullInvoice.created_at).toLocaleString()}</p>
          <p><strong>Expires At:</strong> {new Date(fullInvoice.expires_at).toLocaleString()}</p>
          <p><strong>Payment Hash:</strong> {fullInvoice.payment_hash}</p>
        </div>
        <button 
          onClick={checkFullInvoice} 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Check Invoice Status
        </button>
      </div>
    </div>
  );
};

export default FullInvoice;