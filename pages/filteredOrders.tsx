import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';
import Head from 'next/head';

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
    console.log("useEffect triggered");

    const orderData = { };
    console.log("Signing event with orderData:");
    signAndSendEvent(orderData)
      .then(() => {
        console.log("Event signed successfully");
        setIsSigned(true);
      })
      .catch((error) => {
        console.error("Error signing event:", error);
      });

    const handleEventReceived = (event: any[]) => {
      console.log('Event received:', event);
      if (!event || event.length < 3) {
        console.log('No valid event received');
        return;
      }

      const order: OrderEvent = {
        id: event?.id,
        content: JSON.parse(event?.content),
        kind: event?.kind,
        created_at: event?.created_at,
        tags: event?.tags,
      };
      console.log('Order created:', order);
      setOrders((prevOrders) => {
        // Check if the order ID already exists in the previous orders
        const orderExists = prevOrders.some((prevOrder) => prevOrder.id === order.id);
        if (orderExists) {
          console.log(`Order with ID ${order.id} already exists. Skipping.`);
          return prevOrders;
        }
        const newOrders = [...prevOrders, order];
        console.log("Orders after adding new event:", newOrders);
        return newOrders;
      });
    };

    console.log("Subscribing to orders");
    const unsubscribe = subscribeToEvents(handleEventReceived, [1506]);
    console.log("Subscribed to orders");

    return () => {
      console.log("Unsubscribing from orders");
      unsubscribe();
    };
  }, [signAndSendEvent, subscribeToEvents]);

  useEffect(() => {
    console.log('Orders:', orders);
    const filtered = orders.filter(order => order.kind === 1506);
    setFilteredOrders(filtered);
    console.log('Filtered Orders:', filteredOrders);
  }, [orders]);

  return (
    <>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </Head>
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
    </>
  );
};

export default FilteredOrders;
