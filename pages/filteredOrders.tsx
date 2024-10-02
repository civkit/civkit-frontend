import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface OrderEvent {
  id: string;
  content: { [key: string]: any };
  kind: number;
  created_at: number;
  tags: any[];
}

const FilteredOrders = () => {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();
  const [filteredOrders, setFilteredOrders] = useState<OrderEvent[]>([]);

  useEffect(() => {
    const orderData = {}; // Define your order data here
    signAndSendEvent(orderData)
      .then(() => {
        setIsSigned(true);
      })
      .catch((error) => {
        console.error("Error signing event:", error);
      });

    const handleEventReceived = (event: any[]) => {
      if (!event || event.length < 3) return;

      const order: OrderEvent = {
        id: event[0], // Assuming event[0] is the ID
        content: JSON.parse(event[1]), // Assuming event[1] is the content
        kind: event[2], // Assuming event[2] is the kind
        created_at: event[3], // Assuming event[3] is the created_at
        tags: event[4], // Assuming event[4] is the tags
      };

      // Only add orders of kind 1506
      if (order.kind === 1506) {
        setOrders((prevOrders) => {
          if (!prevOrders.some((prevOrder) => prevOrder.id === order.id)) {
            return [...prevOrders, order];
          }
          return prevOrders;
        });
      }
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1506]);

    return () => {
      unsubscribe();
    };
  }, [signAndSendEvent, subscribeToEvents]);

  useEffect(() => {
    setFilteredOrders(orders.filter(order => order.kind === 1506));
  }, [orders]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Filtered Orders</h2>
        {isSigned ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.content.order_id}</h3>
                  <p className="text-gray-700">Status: {order.content.status}</p>
                  <p className="text-gray-700">Amount (msat): {order.content.amount_msat}</p>
                  <p className="text-gray-700">Currency: {order.content.currency}</p>
                  <p className="text-gray-700">Payment Method: {order.content.payment_method}</p>
                  <p className="text-gray-700">Type: {order.content.type}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-700">No orders found.</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-700">Signing event, please wait...</p>
        )}
      </div>
    </div>
  );
};

export default FilteredOrders;
