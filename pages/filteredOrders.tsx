import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

const FilteredOrders = () => {
  const [orders, setOrders] = useState<any[]>([]); // Use any for simplicity
  const { subscribeToEvents } = useNostr();

  useEffect(() => {
    const handleEventReceived = (event: any[]) => {
      // Log the entire event for debugging
      console.log('Received event:', event);

      // Check if the event is of kind 1506
      if (event[0] === 'EVENT' && event[2]?.kind === 1506) {
        // Add the event to the orders state
        setOrders((prevOrders) => [...prevOrders, event[2]]);
      }
    };

    const unsubscribe = subscribeToEvents(handleEventReceived);

    return () => {
      unsubscribe();
    };
  }, [subscribeToEvents]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Filtered Orders</h2>
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.id}</h3>
                <p className="text-gray-700">Content: {order.content}</p>
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
