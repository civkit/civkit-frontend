import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import Spinner from '../components/Spinner';
import { FaSun, FaMoon } from 'react-icons/fa';

const RegisterPayment: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}> = ({ darkMode, toggleDarkMode }) => {
  const router = useRouter();
  const { username } = router.query;
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [status, setStatus] = useState('');
  const [isFullPaid, setIsFullPaid] = useState(false);

  const fetchInvoice = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-invoice`,
        { username },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-invoice`,
        { username },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (
        response.data.status === 'complete' ||
        response.data.status === 'paid'
      ) {
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
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4'>
        Fetching your invoice... <Spinner />
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}
    >
      <button onClick={toggleDarkMode} className='absolute right-12 top-12'>
        {darkMode ? (
          <FaSun className='text-yellow-500' />
        ) : (
          <FaMoon className='text-gray-600' />
        )}
      </button>
      <div
        className={`w-full max-w-md rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-8 text-center shadow-lg`}
      >
        <h1 className='mb-6 text-2xl font-bold'>Complete Your Registration</h1>
        <p className='mb-6'>
          Please pay the following invoice to complete your registration:
        </p>
        <div className='mb-6 flex justify-center'>
          <QRCode value={invoice} size={200} />
        </div>
        <div
          className={`mb-6 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'} p-4`}
        >
          <p className='break-all font-mono text-sm'>{invoice}</p>
        </div>
        <div className='mb-4'>
          <span className='font-semibold'>Status: </span>
          <span
            className={`${status === 'paid' || isFullPaid ? 'text-green-600' : 'text-yellow-600'}`}
          >
            {status || (isFullPaid ? 'Paid' : 'Not Paid')}
          </span>
        </div>
        <p className='text-sm'>
          The page will automatically redirect you once the payment is
          confirmed.
        </p>
      </div>
    </div>
  );
};

export default RegisterPayment;
