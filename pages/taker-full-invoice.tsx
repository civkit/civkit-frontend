import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const TakerFullInvoice = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [fullInvoice, setFullInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const createAndFetchTakerFullInvoice = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      // First, try to create the full invoice
      const createResponse = await axios.post(`http://localhost:3000/api/taker-full-invoice/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Create full invoice response:', createResponse.data);

      if (createResponse.data && createResponse.data.invoice) {
        setFullInvoice(createResponse.data.invoice);
        setError(null);
      } else {
        // If creation fails, try to fetch an existing invoice
        const fetchResponse = await axios.get(`http://localhost:3000/api/full-invoice/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Fetched taker full invoice:', fetchResponse.data);
        
        if (fetchResponse.data && fetchResponse.data.invoice) {
          setFullInvoice(fetchResponse.data.invoice);
          setError(null);
        } else {
          setError('Full invoice not available. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating or fetching taker full invoice:', error);
      if (error.response && error.response.status === 404) {
        setError('Failed to create or fetch full invoice. Please try again.');
      } else {
        setError(`Failed to create or fetch taker full invoice: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      createAndFetchTakerFullInvoice();
      // Retry every 5 seconds if invoice is not available
      const intervalId = setInterval(() => {
        if (!fullInvoice) {
          createAndFetchTakerFullInvoice();
        }
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [orderId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!fullInvoice) {
    return <div>No invoice data available.</div>;
  }

  return (
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
      <button onClick={createAndFetchTakerFullInvoice}>Refresh Invoice Status</button>
    </div>
  );
};

export default TakerFullInvoice;