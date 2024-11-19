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

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='mx-auto max-w-7xl'>
        <h2 className='mb-6 text-center text-3xl font-bold text-gray-800'>
          Active Orders
        </h2>
        {isSigned ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.order_id}
                  className='overflow-hidden rounded-lg bg-white shadow-lg transition-all hover:shadow-xl'
                >
                  <div className='border-b border-gray-200 bg-gray-50 p-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-bold text-gray-800'>
                        Order #{order.order_id}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-sm ${
                        order.status === 'active' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    {order.created_at && (
                      <p className='mt-1 text-sm text-gray-600'>
                        Created {timeAgo(order.created_at)}
                      </p>
                    )}
                  </div>
                  
                  <div className='space-y-3 p-4'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Amount:</span>
                      <span className='font-medium'>
                        {formatMsatToBTC(order.amount_msat)} BTC
                      </span>
                    </div>
                    
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Currency:</span>
                      <span className='font-medium'>{order.currency}</span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Payment Method:</span>
                      <span className='font-medium'>{order.payment_method}</span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Type:</span>
                      <span className='font-medium'>
                        {order.type === 0 ? 'Buy' : 'Sell'}
                      </span>
                    </div>

                    {order.premium && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Premium:</span>
                        <span className='font-medium'>{order.premium}%</span>
                      </div>
                    )}

                    {order.exchange_rate && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Rate:</span>
                        <span className='font-medium'>
                          {order.exchange_rate} {order.currency}/BTC
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='border-t border-gray-200 bg-gray-50 p-4'>
                    <a
                      href={`${order.frontend_url}/take-order?orderId=${order.order_id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block w-full rounded-lg bg-blue-500 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-600'
                    >
                      Take Order
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className='col-span-full text-center text-gray-500'>
                No active orders found.
              </div>
            )}
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
