import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

// Enhanced interface for rating details
interface RatingData {
  order_id: number;
  rating: number;
  review?: string;
  maker_pubkey?: string;
  taker_pubkey?: string;
  created_at?: number;
}

interface RatingEvent {
  id: string;
  content: string;
  kind: number;
  created_at: number;
  tags: any[];
  pubkey: string;
}

const FilteredRatings = () => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();

  // Helper function for time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Helper function to render stars
  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  useEffect(() => {
    // Initialize connection with dummy event
    const dummyEvent = { kind: 1, content: 'Initializing connection' };
    signAndSendEvent(dummyEvent)
      .then(() => setIsSigned(true))
      .catch(error => console.error('Error signing event:', error));

    // Handle incoming events
    const handleEventReceived = (event: RatingEvent) => {
      if (!event?.content) return;

      try {
        const parsedContent: RatingData = JSON.parse(event.content);
        setRatings(prevRatings => {
          // Check for duplicates
          if (prevRatings.some(rating => rating.order_id === parsedContent.order_id)) {
            return prevRatings;
          }
          // Add event metadata to rating
          const enrichedRating = {
            ...parsedContent,
            created_at: event.created_at,
            maker_pubkey: event.pubkey
          };
          // Sort by newest first
          return [...prevRatings, enrichedRating]
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        });
      } catch (error) {
        console.error('Error parsing event content:', error);
      }
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1508]);
    return () => unsubscribe();
  }, [signAndSendEvent, subscribeToEvents]);

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='mx-auto max-w-7xl'>
        <h2 className='mb-6 text-center text-3xl font-bold text-gray-800'>
          Recent Ratings
        </h2>
        {isSigned ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-lg rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taker</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratings.length > 0 ? (
                  ratings.map((rating) => (
                    <tr key={`${rating.order_id}-${rating.created_at}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{rating.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rating.created_at && timeAgo(rating.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-yellow-500">
                          {renderStars(rating.rating)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rating.review || 'No review provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rating.maker_pubkey?.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rating.taker_pubkey?.slice(0, 8)}...
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No ratings found.
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

export default FilteredRatings;