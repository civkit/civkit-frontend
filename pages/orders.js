// components/OrderBook.js
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function OrderBook() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token'); // Retrieve the token from local storage

      try {
        const response = await axios.get('http://localhost:3000/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(response.data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h1>Order Book</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.order_id}>
            {order.order_details} - {order.amount_msat} msat - {order.currency} - {order.payment_method} - {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
