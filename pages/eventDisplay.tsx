import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface NostrEvent {
  id: string;
  kind: number;
  created_at: number;
  content: string;
  tags: string[][];
  pubkey: string;
}

const EventDisplay = () => {
  const [createOrderEvents, setCreateOrderEvents] = useState<NostrEvent[]>([]);
  const [rankingEvents, setRankingEvents] = useState<NostrEvent[]>([]);
  const { subscribeToEvents } = useNostr();

  // Function to check if event is recent (within last 24 hours)
  const isRecent = (timestamp: number) => {
    const oneDayAgo = (Date.now() / 1000) - (24 * 60 * 60);
    return timestamp > oneDayAgo;
  };

  useEffect(() => {
    const handleEventReceived = (event: NostrEvent) => {
      // Only process recent events
      if (!isRecent(event.created_at)) return;

      if (event.kind === 1506) {
        setCreateOrderEvents(prev => {
          const newEvents = [...prev, event]
            .sort((a, b) => b.created_at - a.created_at) // Sort by newest first
            .slice(0, 10); // Keep only 10 most recent
          return newEvents;
        });
      } else if (event.kind === 1508) {
        setRankingEvents(prev => {
          const newEvents = [...prev, event]
            .sort((a, b) => b.created_at - a.created_at)
            .slice(0, 10);
          return newEvents;
        });
      }
      console.log('New event received:', event);
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1506, 1508]);
    return () => unsubscribe();
  }, [subscribeToEvents]);

  // Add time ago display helper
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const EventBox = ({ title, events, borderColor }: { 
    title: string; 
    events: NostrEvent[]; 
    borderColor: string 
  }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${borderColor}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <p className="text-sm text-gray-600">
                {timeAgo(event.created_at)}
              </p>
              <p className="mt-2 font-medium">
                Content: 
                <pre className="font-normal ml-2 break-words bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(JSON.parse(event.content), null, 2)}
                </pre>
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No recent events found</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">Recent CivKit Events</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EventBox 
            title="Recent Create Order Events" 
            events={createOrderEvents}
            borderColor="border-l-4 border-l-blue-500"
          />
          
          <EventBox 
            title="Recent Ranking Events" 
            events={rankingEvents}
            borderColor="border-l-4 border-l-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EventDisplay;
