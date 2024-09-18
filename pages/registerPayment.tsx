import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const RegisterPayment = () => {
  const router = useRouter();
  const { username } = router.query;
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [status, setStatus] = useState('');
  const [isFullPaid, setIsFullPaid] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-invoice`, { username }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const { invoice, payment_hash, status } = response.data;
      setInvoice(invoice);
      setPaymentHash(payment_hash);
      setStatus(status);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    }
  };

  const checkInvoiceStatus = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-invoice`, { username }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.status === 'complete' || response.data.status === 'paid') {
        setIsFullPaid(true);
      }
      setStatus(response.data.status);
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
      const interval = setInterval(checkInvoiceStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentHash, isFullPaid]);

  useEffect(() => {
    if (isFullPaid) {
      router.push('/login');
    }
  }, [isFullPaid, router]);

  if (!invoice) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Complete Your Registration</h1>
        <p className="mb-6 text-gray-600">Please pay the following invoice to complete your registration:</p>
        <div className="mb-6 flex justify-center">
          <QRCode value={invoice} size={200} />
        </div>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm font-mono break-all">{invoice}</p>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Status: </span>
          <span className={`${status === 'paid' || isFullPaid ? 'text-green-600' : 'text-yellow-600'}`}>
            {status || (isFullPaid ? 'Paid' : 'Not Paid')}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          The page will automatically redirect you once the payment is confirmed.
        </p>
      </div>
    </div>
  );
};

export default RegisterPayment;