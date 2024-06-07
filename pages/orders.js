import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '/home/dave/civkit-frontend/styles/Orders.module.css'; // Import CSS module

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'));
    }

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

  const handleOpenChat = async (orderId) => {
    try {
      const response = await axios.post(
        'http://localhost:3000/api/check-and-create-chatroom',
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Chatroom Response:', response.data);
      const { makeChatUrl, acceptChatUrl } = response.data;

      // Redirect based on the user's role
      const order = orders.find(order => order.order_id === orderId);
      if (!order) {
        console.error('Order not found');
        return;
      }

      if (makeChatUrl && userId === order.customer_id) {
        router.push(makeChatUrl);
      } else if (acceptChatUrl && userId === order.taker_customer_id) {
        router.push(acceptChatUrl);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
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
            <p><strong>Order Type:</strong> {order.type === 0 ? 'Buy' : 'Sell'}</p>
            <button className={styles.takeOrderButton} onClick={() => handleTakeOrder(order.order_id)}>Take Order</button>
            {order.status === 'chat_open' && (
              <button className={styles.openChatButton} onClick={() => handleOpenChat(order.order_id)}>Open Chat</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
