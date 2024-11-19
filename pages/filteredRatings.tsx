import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

// Enhanced interface for rating details
interface RatingData {
  order_id: number;
  rating: number;
  review: string;
  reviewer_npub: string;
  order_type: number;
  rated_user_npub: string;
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

  const handleEventReceived = (event: RatingEvent) => {
    if (!event?.content) return;

    try {
      const parsedContent: RatingData = JSON.parse(event.content);
      console.log('Received rating event:', parsedContent);

      setRatings(prevRatings => {
        // Check for duplicates
        if (prevRatings.some(rating => 
          rating.order_id === parsedContent.order_id && 
          rating.reviewer_npub === parsedContent.reviewer_npub
        )) {
          return prevRatings;
        }

        // Ensure pubkeys are strings before enriching
        const enrichedRating = {
          ...parsedContent,
          created_at: event.created_at,
          maker_pubkey: String(parsedContent.rated_user_npub || ''),  // Convert to string
          taker_pubkey: String(parsedContent.reviewer_npub || ''),    // Convert to string
          review: parsedContent.review || ''
        };

        // Debug log
        console.log('Enriched rating:', enrichedRating);

        return [...prevRatings, enrichedRating]
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      });
    } catch (error) {
      console.error('Error parsing rating event:', error, 'Event:', event);
    }
  };

  useEffect(() => {
    // Initialize connection with dummy event
    const dummyEvent = { kind: 1, content: 'Initializing connection' };
    signAndSendEvent(dummyEvent)
      .then(() => {
        setIsSigned(true);
        console.log('Connected to Nostr'); // Debug log
      })
      .catch(error => console.error('Error signing event:', error));

    // Subscribe to rating events
    const unsubscribe = subscribeToEvents(handleEventReceived, [1508]);
    console.log('Subscribed to rating events'); // Debug log

    return () => {
      console.log('Unsubscribing from rating events'); // Debug log
      unsubscribe();
    };
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
                        {typeof rating.maker_pubkey === 'string' && rating.maker_pubkey.length > 8 
                          ? `${rating.maker_pubkey.slice(0, 8)}...` 
                          : rating.maker_pubkey || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof rating.taker_pubkey === 'string' && rating.taker_pubkey.length > 8 
                          ? `${rating.taker_pubkey.slice(0, 8)}...` 
                          : rating.taker_pubkey || 'Unknown'}
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