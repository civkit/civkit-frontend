import { useEffect } from 'react';
import { useNostr } from './useNostr';

const FilteredOrders = () => {
  const { subscribeToEvents } = useNostr();

  useEffect(() => {
    const handleEventReceived = (event: any[]) => {
      if (!event || event.length < 3) return;

      // Log the entire event for debugging
      console.log('Received event:', event);

      // Display the event in the console or handle it as needed
      const orderId = event[0]; // Assuming event[0] is the ID
      const content = event[1]; // Assuming event[1] is the content
      const kind = event[2]; // Assuming event[2] is the kind
      const createdAt = event[3]; // Assuming event[3] is the created_at
      const tags = event[4]; // Assuming event[4] is the tags

      // You can also display the event in the UI if needed
      // For example, you could append it to a list or render it directly
      // Here, we just log it to the console
      console.log(`Order ID: ${orderId}, Content: ${JSON.stringify(content)}, Kind: ${kind}, Created At: ${new Date(createdAt * 1000).toLocaleString()}, Tags: ${JSON.stringify(tags)}`);
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
        <p className="text-center text-gray-700">Check the console for received events.</p>
      </div>
    </div>
  );
};

export default FilteredOrders;
