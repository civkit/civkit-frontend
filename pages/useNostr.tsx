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

    const filterOrders = (orders: any[]) => {
        return orders.filter((order: any) => order.kind === 1506);
    };

    const subscribeToOrders = (callback: (event: any) => void) => {
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }
        const relayWebSocket = new WebSocket(relayURL);

        relayWebSocket.onopen = () => {
            console.log('WebSocket connection opened for subscribing to orders');
            // Subscribe to events of kind 1506
            const subscribeMessage = JSON.stringify(['REQ', 'subscription-id', { kinds: [1506] }]);
            relayWebSocket.send(subscribeMessage);
        };

        relayWebSocket.onmessage = (message) => {
            const event = JSON.parse(message.data);
            if (event[0] === 'EVENT') {
                callback(event[1]);
            }
        };

        relayWebSocket.onerror = (err) => {
            console.error('WebSocket error:', err);
        };

        relayWebSocket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            relayWebSocket.close();
        };
    };

    return { signAndSendEvent, filterOrders, subscribeToOrders };
};
