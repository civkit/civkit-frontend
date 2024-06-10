import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import styles from '../styles/FullInvoice.module.css';

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
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Full Invoice Details</h1>
      <p>Invoice (Full): {fullInvoice.bolt11}</p>
      <QRCode value={fullInvoice.bolt11} />
      <p>Status: {isFullPaid ? 'Paid' : 'Not Paid'}</p>
    </div>
  );
};

export default FullInvoice;
