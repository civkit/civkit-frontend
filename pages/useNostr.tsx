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
                console.warn('NEXT_PUBLIC_FRONTEND_URL is not defined');
            }

            const event = {
                kind: eventKind,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: JSON.stringify({
                    ...orderData,
                    frontend_url: frontendUrl || 'Not specified'
                }),
                pubkey: await window.nostr.getPublicKey(),
            };

            try {
                const signedEvent = await window.nostr.signEvent(event);
                console.log('Signed Event:', signedEvent);

                const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
                if (!relayURL) {
                    throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
                }
                const secureRelayURL = relayURL.replace('ws://', 'wss://');
                const relayWebSocket = new WebSocket(secureRelayURL);

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

    const subscribeToEvents = (onEventReceived: (event: any) => void, kinds: number[] = [1506]) => {
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }
        const secureRelayURL = relayURL.replace('ws://', 'wss://');

        let relayWebSocket: WebSocket;

        const connectWebSocket = () => {
            console.log(`Attempting to connect to WebSocket at ${secureRelayURL}`);
            relayWebSocket = new WebSocket(secureRelayURL);

            relayWebSocket.onopen = () => {
                const message = JSON.stringify(['REQ', 'sub-1', { kinds }]);
                relayWebSocket.send(message);
                console.log(`Subscribed to events of kinds: ${kinds.join(', ')}`);
            };

            relayWebSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);
                if (data[0] === 'EVENT' && kinds.includes(data[2].kind)) {
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
                }
            };
        };

        connectWebSocket();

        return () => {
            relayWebSocket.close();
        };
    };

    return { signAndSendEvent, subscribeToEvents };
};
