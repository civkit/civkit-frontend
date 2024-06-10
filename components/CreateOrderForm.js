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
      const orderData = {
        order_details: orderDetails,
        amount_msat: parseInt(amountMsat),
        currency,
        payment_method: paymentMethod,
        status: 'Pending',
        type
      };

      const response = await axios.post('http://localhost:3000/api/orders', orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.order) {
        // Sign the event using nos2x
        if (window.nostr) {
          const event = {
            kind: 1, // Event kind, you can set this to a relevant kind for your application
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: JSON.stringify(orderData)
          };

          try {
            const signedEvent = await window.nostr.signEvent(event);
            console.log('Signed Event:', signedEvent);

            // Send the signed event to your relay using WebSocket
            const relayURL = 'ws://localhost:7000'; // Change to your actual relay URL

            const relayWebSocket = new WebSocket(relayURL);

            relayWebSocket.onopen = () => {
              const message = JSON.stringify(["EVENT", signedEvent]);
              relayWebSocket.send(message);
              console.log('Signed event sent to relay:', message);
            };

            relayWebSocket.onerror = (err) => {
              console.error('WebSocket error:', err);
            };

            relayWebSocket.onclose = () => {
              console.log('WebSocket connection closed');
            };

          } catch (signError) {
            console.error('Error signing event:', signError);
          }
        } else {
          console.error('nos2x extension is not available.');
        }

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
