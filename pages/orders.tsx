import { useState, useEffect } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Orders fetched:', response.data);
      const fetchedOrders = Array.isArray(response.data) ? response.data : response.data.orders || [];
      
      const updatedOrders = await Promise.all(
        fetchedOrders.map(order => fetchChatDetails(order))
      );
      
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatDetails = async (order) => {
    if (order.status === 'chat_open') {
      try {
        console.log(`Fetching chat details for order ${order.order_id}`);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/${order.order_id}/latest-chat-details`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log(`Chat details for order ${order.order_id}:`, response.data);
        return { 
          ...order, 
          chatUrl: response.data.chatUrl,
          acceptOfferUrl: response.data.acceptOfferUrl 
        };
      } catch (error) {
        console.error(`Error fetching chat details for order ${order.order_id}:`, error);
        return order;
      }
    }
    return order;
  };

  const handleOpenChat = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTakeOrder = async (orderId) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/take`,
        { orderId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      console.log('Order taken successfully:', response.data);
      fetchOrders(); // Refresh orders after taking one
    } catch (error) {
      console.error('Error taking order:', error);
    }
  };

  const refreshOrder = async (orderId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const updatedOrder = await fetchChatDetails(response.data);
      setOrders(prevOrders => prevOrders.map(order => 
        order.order_id === updatedOrder.order_id ? updatedOrder : order
      ));
    } catch (error) {
      console.error(`Error refreshing order ${orderId}:`, error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order Book</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.order_id} className="border rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Order #{order.order_id}</h2>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Type:</strong> {order.type === 0 ? 'Buy' : 'Sell'}</p>
            <p><strong>Amount:</strong> {order.amount_msat} msat</p>
            <p><strong>Currency:</strong> {order.currency}</p>
            
            {order.status === 'chat_open' && (
              <div className="mt-4">
                {order.chatUrl && (
                  <button 
                    onClick={() => handleOpenChat(order.chatUrl)}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Open Chat (Maker)
                  </button>
                )}
                {order.acceptOfferUrl && (
                  <button 
                    onClick={() => handleOpenChat(order.acceptOfferUrl)}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Open Chat (Taker)
                  </button>
                )}
                {(!order.chatUrl && !order.acceptOfferUrl) && (
                  <p className="text-yellow-600">No chat available</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <button 
                onClick={() => handleTakeOrder(order.order_id)}
                className="bg-orange-500 text-white px-4 py-2 rounded mr-2"
              >
                Take Order
              </button>
              <button 
                onClick={() => refreshOrder(order.order_id)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
