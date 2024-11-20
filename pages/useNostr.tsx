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
        if (!relayURL) return;
        
        const relayWebSocket = new WebSocket(relayURL);
        relayWebSocket.onopen = () => {
          relayWebSocket.send(JSON.stringify(['EVENT', signedEvent]));
        };
      } catch (_) {}
    }
  };

  const subscribeToEvents = (
    onEventReceived: (event: any) => void,
    kinds: number[] = [1506, 1508]
  ) => {
    const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
    if (!relayURL) return () => {};

    let relayWebSocket: WebSocket;

    const connectWebSocket = () => {
      relayWebSocket = new WebSocket(relayURL);
      relayWebSocket.onopen = () => {
        relayWebSocket.send(JSON.stringify(['REQ', 'sub-1', { kinds }]));
      };
      relayWebSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data[0] === 'EVENT' && kinds.includes(data[2].kind)) {
            onEventReceived(data[2]);
          }
        } catch (_) {}
      };
    };

    connectWebSocket();
    return () => relayWebSocket?.close();
  };

  return { signAndSendEvent, subscribeToEvents };
};
