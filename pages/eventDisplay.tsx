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

    const unsubscribe = subscribeToEvents(handleEventReceived);
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
              <p className="mt-2 font-medium">
                Content: 
                <span className="font-normal ml-2 break-words">
                  {JSON.stringify(JSON.parse(event.content), null, 2)}
                </span>
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

    <div className='flex min-h-screen flex-col justify-center bg-gray-100 py-6 sm:py-12'>
      <div className='relative py-3 sm:mx-auto sm:max-w-xl'>
        <div className='to-light-blue-500 absolute inset-0 w-5/6 -skew-y-6 transform bg-gradient-to-r from-cyan-400 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl'></div>
        <div className='relative bg-white px-4 py-10 shadow-lg sm:rounded-3xl sm:p-20'>
          <h1 className='mb-5 text-2xl font-bold'>Nostr Events</h1>
          <div className='space-y-4'>
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className='overflow-hidden rounded-lg border p-4'
                >
                  <p className='mb-2'>
                    <strong className='font-semibold'>ID:</strong>{' '}
                    <span className='break-all'>{event.id}</span>
                  </p>
                  <p className='mb-2'>
                    <strong className='font-semibold'>Kind:</strong>{' '}
                    {event.kind}
                  </p>
                  <p className='mb-2'>
                    <strong className='font-semibold'>Created at:</strong>{' '}
                    {new Date(event.created_at * 1000).toLocaleString()}
                  </p>
                  <p className='mb-2'>
                    <strong className='font-semibold'>Content:</strong>{' '}
                    <span className='break-words'>{event.content}</span>
                  </p>
                  <p className='mb-2'>
                    <strong className='font-semibold'>Pubkey:</strong>{' '}
                    <span className='break-all'>{event.pubkey}</span>
                  </p>
                </div>
              ))
            ) : (
              <p>No events found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDisplay;
