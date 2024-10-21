import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';

interface FullInvoiceProps {
  orderId: string;
}

const FullInvoice: React.FC<FullInvoiceProps> = ({ orderId }) => {
  const [fullInvoice, setFullInvoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullInvoice = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/full-invoice/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setFullInvoice(response.data.bolt11);
      } catch (error) {
        console.error('Error fetching full invoice:', error);
        setError('Failed to fetch full invoice');
      }
    };

    fetchFullInvoice();
  }, [orderId]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!fullInvoice) {
    return <div>Loading full invoice...</div>;
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-bold text-orange-500">Full Invoice</h2>
      <p className="mb-4 break-words">
        <span className="font-bold text-gray-700">Invoice:</span> {fullInvoice}
      </p>
      <div className="mb-4 flex justify-center">
        <QRCode value={fullInvoice} size={200} />
      </div>
    </div>
  );
};

export default FullInvoice;
