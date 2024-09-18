export const useNostr = () => {
    const signAndSendEvent = async (orderData, eventKind = 1506) => {
      if (window.nostr) {
        const event = {
          kind: eventKind,
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify(orderData),
        };
  
        try {
          const signedEvent = await window.nostr.signEvent(event);
          console.log('Signed Event:', signedEvent);
  
          const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
          if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
          }
          const relayWebSocket = new WebSocket(relayURL);
  
          relayWebSocket.onopen = () => {
            const message = JSON.stringify(['EVENT', signedEvent]);
            relayWebSocket.send(message);
            console.log('Signed event sent to relay:', message);
          };
  
          relayWebSocket.onerror = (err) => {
            console.error('WebSocket error:', err);
          };
  
          relayWebSocket.onclose = () => {
            console.log('WebSocket connection closed');
          };
        } catch (signError) {
          console.error('Error signing event:', signError);
        }
      } else {
        console.error('nos2x extension is not available.');
      }
    };
  
    return { signAndSendEvent };
  };
