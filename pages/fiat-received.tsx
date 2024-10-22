import React from 'react';
import axios from 'axios';

interface FiatReceivedProps {
  orderId: number;
  onComplete: () => void;
}

const FiatReceived: React.FC<FiatReceivedProps> = ({ orderId, onComplete }) => {
  const handleFiatReceived = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fiat-received`,
        { order_id: orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      onComplete();
    } catch (error) {
      console.error('Error processing fiat received:', error);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-bold text-orange-500">Fiat Received</h2>
      {orderId ? (
        <>
          <p className="mb-4">Have you received the fiat payment for order {orderId}?</p>
          <button
            onClick={handleFiatReceived}
            className="w-full rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
          >
            Confirm Fiat Received
          </button>
        </>
      ) : (
        <p className="mb-4">No order selected. Please go back and select an order.</p>
      )}
    </div>
  );
};

export default FiatReceived;
