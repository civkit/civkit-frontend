import React, { useEffect, useState } from 'react'
import { Event } from 'nostr-tools'
import { useNostr } from './useNostr'

const FilteredOrders: React.FC = () => {
  const { signAndSendEvent, subscribeToEvents, isSigned, isConnecting, connectionError } = useNostr();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (isConnecting) {
      console.log('Connecting to relay...');
      return;
    }

    if (connectionError) {
      console.error('Failed to connect to relay:', connectionError);
      return;
    }

    console.log('useEffect triggered');
    const signEvent = async () => {
      try {
        console.log('Signing event with orderData:');
        await signAndSendEvent({ orderData: {}, eventKind: 1506 });
      } catch (error) {
        console.error('Error signing event:', error);
      }
    };

    signEvent();

    console.log('Subscribing to orders');
    const unsubscribe = subscribeToEvents((event) => {
      console.log('Received order event:', event);
      setEvents(prevEvents => [...prevEvents, event]);
    }, [1506]);

    return () => {
      unsubscribe();
    };
  }, [isConnecting, connectionError, signAndSendEvent, subscribeToEvents]);

  if (isConnecting) {
    return <div>Connecting to relay... This may take up to 10 seconds.</div>;
  }

  if (connectionError) {
    return (
      <div>
        <h2>Connection Error</h2>
        <p>{connectionError}</p>
        <p>Please check your relay settings and ensure it's running and accessible.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Filtered Orders</h1>
      <p>Signed: {isSigned ? 'Yes' : 'No'}</p>
      <h2>Received Events:</h2>
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            <strong>ID:</strong> {event.id.slice(0, 10)}...
            <br />
            <strong>Pubkey:</strong> {event.pubkey.slice(0, 10)}...
            <br />
            <strong>Created at:</strong> {new Date(event.created_at * 1000).toLocaleString()}
            <br />
            <strong>Kind:</strong> {event.kind}
            <br />
            <strong>Content:</strong> {event.content}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilteredOrders;
