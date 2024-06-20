// pages/registerPayment.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const RegisterPayment = () => {
  const router = useRouter();
  const { username } = router.query;
  const [invoice, setInvoice] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/get-invoice', { username }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setInvoice(response.data.invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchInvoice();
    }
  }, [username]);

  useEffect(() => {
    if (invoice) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.post('http://localhost:3000/api/fullinvoicelookup', { payment_hash: invoice.payment_hash }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (response.data.status === 'paid') {
            setIsPaid(true);
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error checking invoice status:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [invoice]);

  if (!invoice) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Complete Your Registration</h1>
        <p className="mb-4">Please pay the following invoice to complete your registration:</p>
        <QRCode value={invoice} />
        <p className="mt-4">{invoice}</p>
        <p>Status: {isPaid ? 'Paid' : 'Not Paid'}</p>
      </div>
    </div>
  );
};

export default RegisterPayment;
