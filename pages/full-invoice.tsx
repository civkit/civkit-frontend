import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const FullInvoice = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [fullInvoice, setFullInvoice] = useState(null);
  const [isFullPaid, setIsFullPaid] = useState(false);

  const fetchFullInvoice = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/full-invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setFullInvoice(response.data);
      // Check the status immediately after fetching
      if (response.data.payment_hash) {
        await checkInvoiceStatus(response.data.payment_hash);
      }
    } catch (error) {
      console.error('Error fetching full invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash) => {
    try {
      const response = await axios.post('http://localhost:3000/api/fullinvoicelookup', {
        payment_hash: paymentHash,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Log the response to ensure we are receiving the correct state
      console.log('Invoice status response:', response.data);

      if (response.data.status === 'paid') {
        setIsFullPaid(true);
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  const syncInvoices = async () => {
    try {
      await axios.post('http://localhost:3000/api/sync-invoices', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      await fetchFullInvoice();  // Re-fetch the invoice to update its status
    } catch (error) {
      console.error('Error syncing invoices:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchFullInvoice();
    }
  }, [orderId]);

  useEffect(() => {
    if (fullInvoice && fullInvoice.payment_hash && !isFullPaid) {
      const interval = setInterval(() => {
        checkInvoiceStatus(fullInvoice.payment_hash);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fullInvoice, isFullPaid]);

  useEffect(() => {
    const syncInterval = setInterval(syncInvoices, 60000);  // Sync invoices every 60 seconds
    return () => clearInterval(syncInterval);
  }, []);

  if (!fullInvoice) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
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
        <p className="text-center font-bold">Status: {isFullPaid ? 'Paid' : 'Not Paid'}</p>
      </div>
    </div>
  );
};

export default FullInvoice;
