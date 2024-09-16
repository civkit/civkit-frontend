// pages/registerPayment.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const RegisterPayment = () => {
  const router = useRouter();
  const { username } = router.query;
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [status, setstatus] = useState('');
  const [isFullPaid, setIsFullPaid] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/get-invoice', { username }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const { invoice, payment_hash, status } = response.data;
      console.log('Fetched invoice:', invoice);
      setInvoice(invoice);
      setPaymentHash(payment_hash);
      setstatus(status)
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const checkInvoiceStatus = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/get-invoice', { username }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Invoice status response:', response.data);

      if (response.data.status === 'complete' || response.data.status === 'paid') {
        setIsFullPaid(true);
      }
      setstatus(response.data.status);
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchInvoice();
    }
  }, [username]);

  useEffect(() => {
    if (paymentHash && !isFullPaid) {
      const interval = setInterval(() => {
        checkInvoiceStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentHash, isFullPaid]);

  useEffect(() => {
    if (isFullPaid) {
      router.push('/login');  // Redirect to the registration page
    }
  }, [isFullPaid, router]);


  if (!invoice) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Complete Your Registration</h1>
        <p className="mb-4">Please pay the following invoice to complete your registration:</p>
        <QRCode value={invoice} />
        <p className="mt-4 break-all">{invoice}</p>
        <p>Status: {status || (isFullPaid ? 'Paid' : 'Not Paid')}</p>
      </div>
    </div>
  );
};

export default RegisterPayment;
