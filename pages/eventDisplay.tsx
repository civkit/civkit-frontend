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
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const { subscribeToEvents } = useNostr();

  useEffect(() => {
    const handleEventReceived = (event: NostrEvent) => {
      setEvents((prevEvents) => [...prevEvents, event]);
      console.log("Events:", events);
      
    };

    const unsubscribe = subscribeToEvents(handleEventReceived);

    return () => {
      unsubscribe();
    };
  }, [subscribeToEvents]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl w-5/6"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-2xl font-bold mb-5">Nostr Events</h1>
          <div className="space-y-4">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="border p-4 rounded-lg overflow-hidden">
                <p className="mb-2"><strong className="font-semibold">ID:</strong> <span className="break-all">{event.id}</span></p>
                <p className="mb-2"><strong className="font-semibold">Kind:</strong> {event.kind}</p>
                <p className="mb-2"><strong className="font-semibold">Created at:</strong> {new Date(event.created_at * 1000).toLocaleString()}</p>
                <p className="mb-2"><strong className="font-semibold">Content:</strong> <span className="break-words">{event.content}</span></p>
                <p className="mb-2"><strong className="font-semibold">Pubkey:</strong> <span className="break-all">{event.pubkey}</span></p>
              </div>
            )) : <p>No events found</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDisplay;
