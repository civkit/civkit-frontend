// components/CreateOrderForm.js

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const CreateOrderForm = () => {
  const [orderDetails, setOrderDetails] = useState('');
  const [amountMsat, setAmountMsat] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [type, setType] = useState(0); // Default to Buy Order
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/orders', {
        order_details: orderDetails,
        amount_msat: parseInt(amountMsat),
        currency,
        payment_method: paymentMethod,
        status: 'Pending',
        type
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.order) {
        router.push(`/orders/${response.data.order.order_id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Order Details:</label>
        <input type="text" value={orderDetails} onChange={(e) => setOrderDetails(e.target.value)} required />
      </div>
      <div>
        <label>Amount (msat):</label>
        <input type="number" value={amountMsat} onChange={(e) => setAmountMsat(e.target.value)} required />
      </div>
      <div>
        <label>Currency:</label>
        <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
      </div>
      <div>
        <label>Payment Method:</label>
        <input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required />
      </div>
      <div>
        <label>Order Type:</label>
        <select value={type} onChange={(e) => setType(parseInt(e.target.value))} required>
          <option value={0}>Buy</option>
          <option value={1}>Sell</option>
        </select>
      </div>
      <button type="submit">Create Order</button>
    </form>
  );
};

export default CreateOrderForm;
