interface Order {
  [key: number]: {
    id: string;
    kind: number;
  };
}

export const useNostr = () => {
  const signAndSendEvent = async (orderData: any, eventKind = 1506) => {
    if (window.nostr) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
      if (!frontendUrl) {
        // Silenced warning
      }

      const event = {
        kind: eventKind,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          ...orderData,
          frontend_url: frontendUrl || 'Not specified',
        }),
        pubkey: await window.nostr.getPublicKey(),
      };

      try {
        const signedEvent = await window.nostr.signEvent(event);
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
          throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }
        const relayWebSocket = new WebSocket(relayURL);

        relayWebSocket.onopen = () => {
          const message = JSON.stringify(['EVENT', signedEvent]);
          relayWebSocket.send(message);
        };

        relayWebSocket.onerror = () => {
          // Error silenced
        };

        relayWebSocket.onclose = () => {
          // Close event silenced
        };
      } catch (signError) {
        // Error silenced
      }
    } else {
      // Extension error silenced
    }
  };

  const subscribeToEvents = (
    onEventReceived: (event: any) => void,
    kinds: number[] = [1506, 1508]
  ) => {
    const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
    if (!relayURL) {
      throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
    }

    let relayWebSocket: WebSocket;

    const connectWebSocket = () => {
      relayWebSocket = new WebSocket(relayURL);

      relayWebSocket.onopen = () => {
        const message = JSON.stringify(['REQ', 'sub-1', { kinds }]);
        relayWebSocket.send(message);
      };

      relayWebSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data[0] === 'EVENT' && kinds.includes(data[2].kind)) {
          onEventReceived(data[2]);
        }
      };

      relayWebSocket.onerror = () => {
        // Error silenced
      };

      relayWebSocket.onclose = () => {
        // Close event silenced
      };
    };

    connectWebSocket();

    return () => {
      relayWebSocket.close();
    };
  };

  return { signAndSendEvent, subscribeToEvents };
};
