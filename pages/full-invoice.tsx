import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const FullInvoice = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [fullInvoice, setFullInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFullInvoice = async () => {
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
      setFullInvoice(response.data.invoice);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching full invoice:', error);
      setError(`Failed to fetch full invoice: ${error.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchFullInvoice();
    }
  }, [orderId]);

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
          <p><strong>Amount:</strong> {parseInt(fullInvoice.amount_msat) / 1000} sats</p>
          <p><strong>Status:</strong> {fullInvoice.status}</p>
          <p><strong>Created At:</strong> {new Date(fullInvoice.created_at).toLocaleString()}</p>
          <p><strong>Expires At:</strong> {new Date(fullInvoice.expires_at).toLocaleString()}</p>
        </div>
        <button 
          onClick={fetchFullInvoice} 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Refresh Invoice Status
        </button>
      </div>
    </div>
  );
};

export default FullInvoice;