import { SimplePool, Event } from 'nostr-tools'
import { useState, useCallback } from 'react'

const pool = new SimplePool()
const relays = ['ws://64.7.199.19:7000'] // Add more relays as needed

export const useNostr = () => {
  const [isSigned, setIsSigned] = useState(false);

  const signAndSendEvent = useCallback(async ({ orderData, eventKind }: { orderData: any; eventKind: number }) => {
    console.log('signAndSendEvent called with:', { orderData, eventKind });
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    console.log('Frontend URL:', frontendUrl);

    if (!frontendUrl) {
      throw new Error('NEXT_PUBLIC_FRONTEND_URL is not defined');
    }

    try {
      const event = {
        kind: eventKind,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({ frontend_url: frontendUrl }),
      };

      console.log('Created event:', event);

      // @ts-ignore
      const signedEvent = await window.nostr.signEvent(event);
      console.log('Signed Event:', signedEvent);

      const relayUrl = process.env.NEXT_PUBLIC_NOSTR_RELAY;
      console.log('Relay URL:', relayUrl);

      if (!relayUrl) {
        throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
      }

      const pub = pool.publish(relays, signedEvent);
      await Promise.all(pub);
      console.log('Event published successfully');
      setIsSigned(true);
    } catch (error) {
      console.error('Error in signAndSendEvent:', error);
      setIsSigned(false);
    }
  }, []);

  const subscribeToEvents = useCallback((onEventReceived: (event: Event) => void, kinds: number[] = [1]) => {
    console.log('subscribeToEvents called with kinds:', kinds);
    const relayUrl = process.env.NEXT_PUBLIC_NOSTR_RELAY;
    console.log('Relay URL for subscription:', relayUrl);

    if (!relayUrl) {
      throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
    }

    const sub = pool.sub(relays, [{ kinds }]);

    sub.on('event', (event: Event) => {
      console.log('Received event:', event);
      onEventReceived(event);
    });

    return () => {
      console.log('Unsubscribing from events');
      sub.unsub();
    };
  }, []);

  return { signAndSendEvent, subscribeToEvents, isSigned };
};
