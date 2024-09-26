interface Order {
    [key: number]: {
        id: string;
        kind: number;
    };
}

let globalWebSocket: WebSocket | null = null;

export const useNostr = () => {
    const signAndSendEvent = async (orderData: any, eventKind = 1506) => {
        console.log('signAndSendEvent called with:', { orderData, eventKind });
        if (window.nostr) {
            const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
            console.log('Frontend URL:', frontendUrl);
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
            console.log('Created event:', event);

            try {
                const signedEvent = await window.nostr.signEvent(event);
                console.log('Signed Event:', signedEvent);

                const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
                console.log('Relay URL:', relayURL);
                if (!relayURL) {
                    throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
                }

                if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
                    console.log('Creating new WebSocket connection...');
                    globalWebSocket = new WebSocket(relayURL);

                    globalWebSocket.onopen = () => {
                        console.log('WebSocket connection opened');
                        sendEvent(signedEvent);
                    };

                    globalWebSocket.onerror = (err) => {
                        console.error('WebSocket error:', err);
                    };

                    globalWebSocket.onclose = (event) => {
                        console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                        globalWebSocket = null;
                    };

                    globalWebSocket.onmessage = (msg) => {
                        console.log('Received message from relay:', msg.data);
                        try {
                            const parsedMsg = JSON.parse(msg.data);
                            console.log('Parsed message:', parsedMsg);
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    };
                } else {
                    console.log('Using existing WebSocket connection');
                    sendEvent(signedEvent);
                }

                function sendEvent(event: any) {
                    const message = JSON.stringify(['EVENT', event]);
                    globalWebSocket?.send(message);
                    console.log('Signed event sent to relay:', message);
                }

            } catch (error) {
                console.error('Error signing or sending event:', error);
            }
        } else {
            console.error('nos2x extension is not available.');
        }
    };

    const subscribeToEvents = (onEventReceived: (event: any) => void, kinds: number[] = [1506]) => {
        console.log('subscribeToEvents called with kinds:', kinds);
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        console.log('Relay URL for subscription:', relayURL);
        if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }

        let relayWebSocket: WebSocket;

        const connectWebSocket = () => {
            console.log(`Attempting to connect to WebSocket at ${relayURL}`);
            relayWebSocket = new WebSocket(relayURL);

            relayWebSocket.onopen = () => {
                const message = JSON.stringify(['REQ', 'sub-1', { kinds }]);
                relayWebSocket.send(message);
                console.log(`Subscribed to events of kinds: ${kinds.join(', ')}`);
            };

            relayWebSocket.onmessage = (event) => {
                console.log('Raw message received:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('Parsed message:', data);
                    if (data[0] === 'EVENT' && kinds.includes(data[2].kind)) {
                        console.log('Matching event received:', data[2]);
                        onEventReceived(data[2]);
                    } else {
                        console.log('Non-matching event or non-event message received');
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            relayWebSocket.onerror = (err) => {
                console.error('WebSocket error in subscribeToEvents:', err);
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
            console.log('Closing WebSocket connection');
            relayWebSocket.close();
        };
    };

    return { signAndSendEvent, subscribeToEvents };
};
