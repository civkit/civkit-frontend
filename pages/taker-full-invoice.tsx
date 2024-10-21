import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

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

const TakerFullInvoice = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [fullInvoice, setFullInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (orderId) {
        try {
          setLoading(true);
          const invoice = await createAndFetchTakerFullInvoice(orderId as string);
          setFullInvoice(invoice);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInvoice();
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
      <button onClick={() => createAndFetchTakerFullInvoice(orderId as string)}>
        Refresh Invoice Status
      </button>
    </div>
  );
};

export default TakerFullInvoice;
