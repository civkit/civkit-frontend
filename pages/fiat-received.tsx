import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const FiatReceived = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [message, setMessage] = useState('');

  const handleFiatReceived = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/orders/${orderId}/fiat-received`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMessage('Fiat received and payout processed successfully');
      setTimeout(() => router.push('/orders'), 2000);
    } catch (error) {
      console.error('Error processing fiat received:', error);
      setMessage('Error processing fiat received. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Confirm Fiat Received</h1>
        <p className="mb-4 text-gray-700">Are you sure you want to confirm fiat received for Order #{orderId}?</p>
        {message && <p className="mb-4 text-green-600">{message}</p>}
        <button
          onClick={handleFiatReceived}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Confirm Fiat Received
        </button>
      </div>
    </div>
  );
};

export default FiatReceived;