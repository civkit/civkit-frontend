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

  useEffect(() => {
    const handleEventReceived = (event: NostrEvent) => {
      if (event.kind === 1506) {
        setCreateOrderEvents(prev => [...prev, event].slice(-10)); // Keep last 10 events
      } else if (event.kind === 1508) {
        setRankingEvents(prev => [...prev, event].slice(-10)); // Keep last 10 events
      }
      console.log('New event received:', event);
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1506, 1508]);
    return () => unsubscribe();
  }, [subscribeToEvents]);

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
                Created: {new Date(event.created_at * 1000).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                ID: <span className="break-all">{event.id}</span>
              </p>
              <p className="text-sm text-gray-600">
                Pubkey: <span className="break-all">{event.pubkey}</span>
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
          <p className="text-gray-500">No events found</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">CivKit Events</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EventBox 
            title="Create Order Events" 
            events={createOrderEvents}
            borderColor="border-l-4 border-l-blue-500"
          />
          
          <EventBox 
            title="Ranking Events" 
            events={rankingEvents}
            borderColor="border-l-4 border-l-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

export default EventDisplay;
