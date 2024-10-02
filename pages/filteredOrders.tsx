import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface OrderEvent {
  id: string;
  content: any; // Keep as any to avoid JSON parsing issues
  kind: number;
  created_at: number;
  tags: any[];
}

const FilteredOrders = () => {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const { subscribeToEvents } = useNostr();

  useEffect(() => {
    const handleEventReceived = (event: any[]) => {
      if (!event || event.length < 3) return;

      // Assuming event[2] contains the order details
      const order: OrderEvent = {
        id: event[2].id, // Extracting ID from the event
        content: JSON.parse(event[2].content), // Parse the content
        kind: event[2].kind, // Extracting kind
        created_at: event[2].created_at, // Extracting created_at
        tags: event[2].tags, // Extracting tags
      };

      // Add the order to the state
      setOrders((prevOrders) => [...prevOrders, order]);
    };

    const unsubscribe = subscribeToEvents(handleEventReceived);

    return () => {
      unsubscribe();
    };
  }, [subscribeToEvents]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">All Orders</h2>
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.content.order_id}</h3>
                <p className="text-gray-700">Status: {order.content.status}</p>
                <p className="text-gray-700">Amount (msat): {order.content.amount_msat}</p>
                <p className="text-gray-700">Currency: {order.content.currency}</p>
                <p className="text-gray-700">Payment Method: {order.content.payment_method}</p>
                <p className="text-gray-700">Type: {order.content.type}</p>
                <p className="text-gray-700">Frontend URL: <a href={order.content.frontend_url} target="_blank" rel="noopener noreferrer">{order.content.frontend_url}</a></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-700">No orders found.</p>
        )}
      </div>
    </div>
  );
};

export default FilteredOrders;
