import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const FiatReceived = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFiatReceived = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fiat-received`, 
        { order_id: orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setMessage('Fiat received and payout processed successfully');
      setTimeout(() => router.push('/orders'), 2000);
    } catch (error) {
      console.error('Error processing fiat received:', error);
      if (error.response) {
        setError(`Error: ${error.response.data.message || 'Unknown error occurred'}`);
      } else if (error.request) {
        setError('No response received from server. Please try again.');
      } else {
        setError('Error processing request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Confirm Fiat Received</h1>
        <p className="mb-4 text-gray-700">Are you sure you want to confirm fiat received for Order #{orderId}?</p>
        {message && <p className="mb-4 text-green-600">{message}</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <button
          onClick={handleFiatReceived}
          disabled={isLoading}
          className={`w-full ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        >
          {isLoading ? 'Processing...' : 'Confirm Fiat Received'}
        </button>
      </div>
    </div>
  );
};

export default FiatReceived;