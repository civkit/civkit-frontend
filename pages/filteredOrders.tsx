import React, { useEffect, useState } from 'react'
import { Event } from 'nostr-tools'
import { useNostr } from './useNostr'

const GlobalOrderbook: React.FC = () => {
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

  const uniqueEvents = events.reduce((acc, event) => {
    try {
      const content = JSON.parse(event.content);
      if (content.order_id && !acc.some(e => JSON.parse(e.content).order_id === content.order_id)) {
        acc.push(event);
      }
    } catch {} // Ignore parsing errors
    return acc;
  }, [] as Event[]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Global Orderbook</h1>
      <p>Signed: {isSigned ? 'Yes' : 'No'}</p>
      <h2>Received Events:</h2>
      <div>
        {uniqueEvents.map((event, index) => {
          try {
            const content = JSON.parse(event.content);
            return (
              <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>Order ID: {content.order_id}</strong>
                  <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
                </div>
                <p><strong>Pubkey:</strong> {event.pubkey.slice(0, 10)}...</p>
                <p><strong>Kind:</strong> {event.kind}</p>
                <p><strong>Content:</strong></p>
                <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflowX: 'auto' }}>
                  {JSON.stringify(content, null, 2)}
                </pre>
              </div>
            );
          } catch (error) {
            console.error('Error parsing JSON:', error);
            return (
              <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <p><strong>Error:</strong> Invalid JSON content</p>
                <p><strong>Raw Content:</strong> {event.content}</p>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default GlobalOrderbook;
