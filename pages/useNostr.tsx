export const useNostr = () => {
    const signAndSendEvent = async (orderData: any) => {
      try {
        const event = {
          kind: 1506,
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify(orderData),
        };
  
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
  
        console.log('Event signed and published successfully');
        return true;  // Make sure this line is here
      } catch (error) {
        console.error('Error signing and publishing event:', error);
        return false;
      }
    };
  
    return { signAndSendEvent };
  };
