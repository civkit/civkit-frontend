export const useNostr = () => {
    const signAndSendEvent = async (orderData) => {
      if (window.nostr) {
        const event = {
          kind: 1506,
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify(orderData),
        };
  
        try {
          const signedEvent = await window.nostr.signEvent(event);
          console.log('Signed Event:', signedEvent);
  
          const relayURL = 'ws://localhost:7000'; // Change to your actual relay URL
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
  