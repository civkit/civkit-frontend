import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

// Enhanced interface with more order details
interface OrderData {
  order_id: number;
  status: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  type: number;
  frontend_url: string;
  created_at?: number;
  maker_pubkey?: string;
  premium?: number;
  exchange_rate?: number;
  order_description?: string;
  payment_windows?: number;
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

  // Helper function to format msats to BTC
  const formatMsatToBTC = (msat: number) => {
    return (msat / 100000000000).toFixed(8);
  };

  // Helper function for time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  useEffect(() => {
    // Initialize connection with dummy event
    const dummyEvent = { kind: 1, content: 'Initializing connection' };
    signAndSendEvent(dummyEvent)
      .then(() => setIsSigned(true))
      .catch(error => console.error('Error signing event:', error));

    // Handle incoming events
    const handleEventReceived = (event: OrderEvent) => {
      if (!event?.content) return;

      try {
        const parsedContent: OrderData = JSON.parse(event.content);
        setOrders(prevOrders => {
          // Check for duplicates
          if (prevOrders.some(order => order.order_id === parsedContent.order_id)) {
            return prevOrders;
          }
          // Add event metadata to order
          const enrichedOrder = {
            ...parsedContent,
            created_at: event.created_at,
            maker_pubkey: event.pubkey
          };
          // Sort by newest first
          return [...prevOrders, enrichedOrder]
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        });
      } catch (error) {
        console.error('Error parsing event content:', error);
      }
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1506]);
    return () => unsubscribe();
  }, [signAndSendEvent, subscribeToEvents]);

  const handleTakeOrder = (orderId: number) => {
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='mx-auto max-w-7xl'>
        <h2 className='mb-6 text-center text-3xl font-bold text-gray-800'>
          Active Orders
        </h2>
        {isSigned ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.created_at && timeAgo(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.type === 0 ? 
                          <span className="text-green-600">Buy</span> : 
                          <span className="text-red-600">Sell</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMsatToBTC(order.amount_msat)} BTC
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleTakeOrder(order.order_id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Take Order
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No active orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='text-center text-gray-500'>
            Connecting to Nostr network...
          </div>
        )}
      </div>
    </div>
  );
};

export default FilteredOrders;
