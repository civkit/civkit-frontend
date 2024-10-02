import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface OrderEvent {
  id: string;
  content: any; // Change to any to avoid JSON parsing issues
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

      const order: OrderEvent = {
        id: event[0], // Assuming event[0] is the ID
        content: event[1], // Directly use the content without parsing
        kind: event[2], // Assuming event[2] is the kind
        created_at: event[3], // Assuming event[3] is the created_at
        tags: event[4], // Assuming event[4] is the tags
      };

      console.log('Received order:', order); // Log the received order
      setOrders((prevOrders) => [...prevOrders, order]); // Add the order to the state
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
                <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.id}</h3>
                <p className="text-gray-700">Content: {JSON.stringify(order.content)}</p>
                <p className="text-gray-700">Kind: {order.kind}</p>
                <p className="text-gray-700">Created At: {new Date(order.created_at * 1000).toLocaleString()}</p>
                <p className="text-gray-700">Tags: {JSON.stringify(order.tags)}</p>
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
