// pages/orders.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '/home/dave/civkit-frontend/styles/Orders.module.css'; // Import CSS module

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const handleTakeOrder = async (orderId) => {
    try {
      await axios.post(
        'http://localhost:3000/api/orders/take',
        {
          orderId,
          takerDetails: { description: 'Detailed description for the taker' },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      router.push(`/take-order?orderId=${orderId}`);
    } catch (error) {
      console.error('Error taking order:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Order Book</h1>
      <div className={styles.ordersList}>
        {orders.map((order) => (
          <div key={order.order_id} className={styles.orderCard}>
            <p><strong>Details:</strong> {order.order_details}</p>
            <p><strong>Amount:</strong> {order.amount_msat} msat</p>
            <p><strong>Currency:</strong> {order.currency}</p>
            <p><strong>Payment Method:</strong> {order.payment_method}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <button className={styles.takeOrderButton} onClick={() => handleTakeOrder(order.order_id)}>Take Order</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
