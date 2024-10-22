import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';

const TakerFullInvoice = ({ orderId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/taker-full-invoice/${orderId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setInvoice(response.data.invoice);
      } catch (err) {
        console.error('Error fetching taker full invoice:', err);
        setError('Failed to fetch invoice');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchInvoice();
    }
  }, [orderId]);

  if (loading) return <div>Loading invoice...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!invoice) return <div>No invoice data available.</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Taker Full Invoice</h3>
      <div className="mb-4">
        <p className="font-semibold">Invoice:</p>
        <p className="break-all text-sm">{invoice.bolt11}</p>
      </div>
      <div className="mb-4">
        <QRCode value={invoice.bolt11} size={200} />
      </div>
      <div>
        <p><strong>Amount:</strong> {invoice.amount_msat / 1000} sats</p>
        <p><strong>Status:</strong> {invoice.status}</p>
        <p><strong>Created At:</strong> {new Date(invoice.created_at).toLocaleString()}</p>
        <p><strong>Expires At:</strong> {new Date(invoice.expires_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TakerFullInvoice;
