import { finalizeEvent, generateSecretKey, getPublicKey, Event } from 'nostr-tools/pure'
import { Relay } from 'nostr-tools/relay'
import { useState, useCallback, useEffect } from 'react'

let relay: Relay | null = null;

export const useNostr = () => {
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    const connectRelay = async () => {
      const relayUrl = process.env.NEXT_PUBLIC_NOSTR_RELAY;
      if (!relayUrl) {
        throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
      }
      relay = await Relay.connect(relayUrl);
      console.log(`Connected to ${relay.url}`);
    };

    connectRelay();

    return () => {
      if (relay) {
        relay.close();
      }
    };
  }, []);

  const signAndSendEvent = useCallback(async ({ orderData, eventKind }: { orderData: any; eventKind: number }) => {
    console.log('signAndSendEvent called with:', { orderData, eventKind });
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    console.log('Frontend URL:', frontendUrl);

    if (!frontendUrl) {
      throw new Error('NEXT_PUBLIC_FRONTEND_URL is not defined');
    }

    if (!relay) {
      throw new Error('Relay not connected');
    }

    try {
      const eventTemplate = {
        kind: eventKind,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({ frontend_url: frontendUrl, orderData }),
      };

      console.log('Created event template:', eventTemplate);

      // @ts-ignore
      const sk = await window.nostr.getPrivateKey();
      const signedEvent = finalizeEvent(eventTemplate, sk);
      console.log('Signed Event:', signedEvent);

      await relay.publish(signedEvent);
      console.log('Event published successfully');
      setIsSigned(true);
    } catch (error) {
      console.error('Error in signAndSendEvent:', error);
      setIsSigned(false);
    }
  }, []);

  const subscribeToEvents = useCallback((onEventReceived: (event: Event) => void, kinds: number[] = [1]) => {
    console.log('subscribeToEvents called with kinds:', kinds);

    if (!relay) {
      throw new Error('Relay not connected');
    }

    const sub = relay.subscribe([
      {
        kinds: kinds,
      },
    ], {
      onevent(event) {
        console.log('Received event:', event);
        onEventReceived(event);
      },
      oneose() {
        console.log('Subscription complete');
      }
    });

    return () => {
      console.log('Unsubscribing from events');
      sub.close();
    };
  }, []);

  return { signAndSendEvent, subscribeToEvents, isSigned };
};
