import { finalizeEvent, Event } from 'nostr-tools/pure'
import { Relay } from 'nostr-tools/relay'
import { useState, useCallback, useEffect } from 'react'

export const useNostr = () => {
  const [relay, setRelay] = useState<Relay | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connectRelay = async () => {
      let relayUrl = process.env.NEXT_PUBLIC_NOSTR_RELAY;
      if (!relayUrl) {
        setConnectionError('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        setIsConnecting(false);
        return;
      }

      // Convert ws:// to wss:// if the page is loaded over HTTPS
      if (window.location.protocol === 'https:' && relayUrl.startsWith('ws://')) {
        relayUrl = 'wss://' + relayUrl.substr(5);
        console.warn('Converted insecure WebSocket URL to:', relayUrl);
      }

      try {
        console.log('Attempting to connect to relay:', relayUrl);
        const newRelay = await Relay.connect(relayUrl, {
          connectTimeout: 10000, // 10 seconds timeout
        });
        console.log(`Connected to ${newRelay.url}`);
        setRelay(newRelay);
        setIsConnecting(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to relay:', error);
        setConnectionError(`Failed to connect to relay: ${error.message || 'Unknown error'}`);
        setIsConnecting(false);
      }
    };

    connectRelay();

    return () => {
      if (relay) {
        console.log('Closing relay connection');
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
      throw error;
    }
  }, [relay]);

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
  }, [relay]);

  return { signAndSendEvent, subscribeToEvents, isSigned, isConnecting, connectionError };
};
