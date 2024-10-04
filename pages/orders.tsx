import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [chatUrls, setChatUrls] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Orders fetched:', response.data);
      let fetchedOrders = Array.isArray(response.data) ? response.data : response.data.orders || [];
      setOrders(fetchedOrders);
      await checkAndCreateChatrooms(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  const checkAndCreateChatrooms = async (orders) => {
    const updatedOrders = await Promise.all(orders.map(async (order) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-and-create-chatroom`,
          { orderId: order.order_id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return {...order, ...response.data};
      } catch (error) {
        console.error(`Error checking chatroom for order ${order.order_id}:`, error);
        return order;
      }
    }));
    setOrders(updatedOrders);
  };

  const handleTakeOrder = async (orderId) => {
    console.log('Attempting to take order:', orderId);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/take`,
        {
          orderId,
          takerDetails: { description: 'Detailed description for the taker' },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      console.log('Order taken successfully:', response.data);
    } catch (error) {
      console.error('Error taking order:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      alert('Redirecting...');
    }

    // Redirect regardless of success or failure
    window.location.href = `/take-order?orderId=${orderId}`;
  };

  const handleOpenChat = async (orderId) => {
    try {
      console.log(`Fetching chat details for order ID: ${orderId}`);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/${orderId}/latest-chat-details`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Chatroom Response:', response.data);

      const { chatUrl, isMaker, isTaker } = response.data;
      
      if (chatUrl) {
        if (isTaker) {
          const latestUrlResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/latest-accept-chat-url/${orderId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const latestAcceptChatUrl = latestUrlResponse.data.url;
          console.log(`Redirecting taker to ${latestAcceptChatUrl}`);
          window.location.href = latestAcceptChatUrl;
        } else {
          console.log(`Redirecting maker to ${chatUrl}`);
          window.location.href = chatUrl;
        }
      } else {
        console.error('No chat URL received');
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
    }
  };

  const closeModal = () => {
    setChatUrls(null);
  };

  const AcceptOfferUrl = ({ orderId }) => {
    const [acceptOfferUrl, setAcceptOfferUrl] = useState(null);

    useEffect(() => {
      const fetchUrl = async () => {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/${orderId}/latest-chat-details`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          setAcceptOfferUrl(response.data.chatUrl);
        } catch (error) {
          console.error('Error fetching latest chat details:', error);
        }
      };
      fetchUrl();
    }, [orderId]);

    if (!acceptOfferUrl) return null;

    return (
      <p className="text-gray-700">
        <strong>Accept Offer URL:</strong> 
        <a href={acceptOfferUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
          {acceptOfferUrl}
        </a>
      </p>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Order Book</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.order_id} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-2 text-gray-700">Order #{order.order_id}</h3>
                <p className="text-gray-700"><strong>Details:</strong> {order.order_details}</p>
                <p className="text-gray-700"><strong>Amount:</strong> {order.amount_msat} msat</p>
                <p className="text-gray-700"><strong>Currency:</strong> {order.currency}</p>
                <p className="text-gray-700"><strong>Payment Method:</strong> {order.payment_method}</p>
                <p className="text-gray-700"><strong>Status:</strong> {order.status}</p>
                <p className="text-gray-700"><strong>Order Type:</strong> {order.type === 0 ? 'Buy' : 'Sell'}</p>
                <AcceptOfferUrl orderId={order.order_id} />
                <div className="flex justify-between items-center mt-4">
                  <button
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => handleTakeOrder(order.order_id)}
                  >
                    Take Order
                  </button>
                  {order.status === 'chat_open' && (
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => handleOpenChat(order.order_id)}
                    >
                      Open Chat
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-700">No orders found.</p>
          )}
        </div>
      </div>

      {chatUrls && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Chatroom URLs</h2>
            <p className="text-gray-700">
              <strong>Make Offer URL:</strong> 
              <a href={chatUrls.makeOfferUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                {chatUrls.makeOfferUrl}
              </a>
            </p>
            {chatUrls.acceptOfferUrl && (
              <p className="text-gray-700">
                <strong>Accept Offer URL:</strong> 
                <a href={chatUrls.acceptOfferUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  {chatUrls.acceptOfferUrl}
                </a>
              </p>
            )}
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:shadow-outline"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
