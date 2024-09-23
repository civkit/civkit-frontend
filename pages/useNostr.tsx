interface Order {
    [key: number]: {
        id: string;
        kind: number;
    };
}

export const useNostr = () => {
    const signAndSendEvent = async (orderData: any, eventKind = 1506) => {
        if (window.nostr) {
            const event = {
                kind: eventKind,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: JSON.stringify(orderData),
                pubkey: await window.nostr.getPublicKey(),
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

    const subscribeToOrders = (onEventReceived: (event: any) => void) => {
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }

        let relayWebSocket: WebSocket;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        const connectWebSocket = () => {
            console.log(`Attempting to connect to WebSocket at ${relayURL}`);
            relayWebSocket = new WebSocket(relayURL);

            relayWebSocket.onopen = () => {
                reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                const message = JSON.stringify(['REQ', 'sub-1', { kinds: [1506] }]);
                relayWebSocket.send(message);
                console.log('Subscribed to events of kind 1506');
            };

            relayWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);
                if (data[0] === 'EVENT' && data[2].kind === 1506) {
                    onEventReceived(data[2]);
                }
            };

            relayWebSocket.onerror = (err) => {
                console.error('WebSocket error:', err);
            };

            relayWebSocket.onclose = (event) => {
                if (event.wasClean) {
                    console.log(`WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`);
                } else {
                    console.error('WebSocket connection closed unexpectedly');
                    // if (reconnectAttempts < maxReconnectAttempts) {
                    //     reconnectAttempts++;
                    //     console.log(`Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
                    //     setTimeout(() => {
                    //         setTimeout(connectWebSocket, 1000 * reconnectAttempts); // Exponential backoff
                    //     }); // Wait for 5 seconds before attempting to reconnect
                    // } else {
                    //     console.error('Max reconnect attempts reached. Giving up.');
                    // }
                }
            };
        };

        connectWebSocket();

        return () => {
            relayWebSocket.close();
        };
    };

    return { signAndSendEvent, subscribeToOrders };
};
