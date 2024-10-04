import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface OrderEvent {
  id: string;
  content: {
    orderData: {
      order_id: number;
      status: string;
      amount_msat: number;
      currency: string;
      payment_method: string;
      type: number;
    };
    eventKind: number;
    frontend_url: string;
  };
  kind: number;
  created_at: number;
  tags: any[];
}

const FilteredOrders = () => {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
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

    const handleEventReceived = (event: any) => {
      console.log('Event received:', event);
      if (!event || !event.content) {
        console.log('No valid event received');
        return;
      }

      try {
        const parsedContent = JSON.parse(event.content);
        const order: OrderEvent = {
          id: event.id,
          content: parsedContent,
          kind: event.kind,
          created_at: event.created_at,
          tags: event.tags,
        };
        console.log('Order created:', order);
        setOrders((prevOrders) => {
          const orderExists = prevOrders.some((prevOrder) => prevOrder.id === order.id);
          if (orderExists) {
            console.log(`Order with ID ${order.id} already exists. Skipping.`);
            return prevOrders;
          }
          return [...prevOrders, order];
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
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {order.content.orderData.order_id}</h3>
                  <p className="text-gray-700">Status: {order.content.orderData.status}</p>
                  <p className="text-gray-700">Amount (msat): {order.content.orderData.amount_msat}</p>
                  <p className="text-gray-700">Currency: {order.content.orderData.currency}</p>
                  <p className="text-gray-700">Payment Method: {order.content.orderData.payment_method}</p>
                  <p className="text-gray-700">Type: {order.content.orderData.type}</p>
                  <p className="text-gray-700">Event Kind: {order.content.eventKind}</p>
                  <p className="text-gray-700">Frontend URL: {order.content.frontend_url}</p>
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
