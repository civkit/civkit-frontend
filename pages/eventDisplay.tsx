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
      console.log('Events:', events);
    };

    const unsubscribe = subscribeToEvents(handleEventReceived);

    return () => {
      unsubscribe();
    };
  }, [subscribeToEvents]);

  return (
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
