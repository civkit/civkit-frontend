import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface OrderData {
  order_id: number;
  status: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  type: number;
  frontend_url: string;
}

interface OrderEvent {
  id: string;
  content: string;
  kind: number;
  created_at: number;
  tags: any[];
  pubkey: string;
}

const FilteredOrders = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();

  useEffect(() => {
    console.log("useEffect triggered");

    const dummyEvent = { kind: 1, content: "Initializing connection" };
    console.log("Signing event to initialize connection:");
    signAndSendEvent(dummyEvent)
      .then(() => {
        console.log("Event signed successfully");
        setIsSigned(true);
      })
      .catch((error) => {
        console.error("Error signing event:", error);
      });

    const handleEventReceived = (event: OrderEvent) => {
      console.log('Event received:', event);
      if (!event || !event.content) {
        console.log('No valid event received');
        return;
      }

      try {
        const parsedContent: OrderData = JSON.parse(event.content);
        console.log('Parsed content:', parsedContent);
        
        setOrders((prevOrders) => {
          const orderExists = prevOrders.some((prevOrder) => prevOrder.order_id === parsedContent.order_id);
          if (orderExists) {
            console.log(`Order with ID ${parsedContent.order_id} already exists. Skipping.`);
            return prevOrders;
          }
          return [...prevOrders, parsedContent];
        });
      } catch (error) {
        console.error('Error parsing event content:', error);
      }
    };

    console.log("Subscribing to orders");
    const unsubscribe = subscribeToEvents(handleEventReceived, [1506]);
    console.log("Subscribed to orders");

    return () => {
      console.log("Unsubscribing from orders");
      unsubscribe();
    };
  }, [signAndSendEvent, subscribeToEvents]);

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Filtered Orders</h2>
      {isSigned ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.order_id} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.order_id}</h3>
                <p className="text-gray-700">Status: {order.status}</p>
                <p className="text-gray-700">Amount (msat): {order.amount_msat}</p>
                <p className="text-gray-700">Currency: {order.currency}</p>
                <p className="text-gray-700">Payment Method: {order.payment_method}</p>
                <p className="text-gray-700">Type: {order.type}</p>
                <p className="text-gray-700">
                  Frontend URL: 
                  <a 
                    href={order.frontend_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-700 ml-1"
                  >
                    Take Order
                  </a>
                </p>
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
