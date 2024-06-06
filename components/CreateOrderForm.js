import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function CreateOrderForm() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState({
    order_details: '',
    amount_msat: 0,
    currency: 'USD',
    payment_method: '',
    type: 0,
    status: 'Pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails({
      ...orderDetails,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/orders', orderDetails, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const orderId = response.data.order.order_id;  // Adjusted to match response structure
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Order Details:
          <input type="text" name="order_details" value={orderDetails.order_details} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Amount (msat):
          <input type="number" name="amount_msat" value={orderDetails.amount_msat} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Currency:
          <input type="text" name="currency" value={orderDetails.currency} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Payment Method:
          <input type="text" name="payment_method" value={orderDetails.payment_method} onChange={handleChange} required />
        </label>
      </div>
      <div>
        <label>
          Type (0 for buy, 1 for sell):
          <input type="number" name="type" value={orderDetails.type} onChange={handleChange} required />
        </label>
      </div>
      <button type="submit">Create Order</button>
    </form>
  );
}
