// pages/fiat-received.js
import { useRouter } from 'next/router';
import axios from 'axios';

const FiatReceived = () => {
  const router = useRouter();
  const { orderId } = router.query;

  const handleFiatReceived = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fiat-received`, {
        order_id: orderId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.message) {
        router.push(`/order-details?orderId=${orderId}`);
      }
    } catch (error) {
      console.error('Error confirming fiat received:', error);
    }
  };

  return (
    <div className="container">
      <h1>Fiat Received</h1>
      <button onClick={handleFiatReceived}>Confirm Fiat Received</button>
    </div>
  );
};

export default FiatReceived;
