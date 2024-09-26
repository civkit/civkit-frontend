interface Order {
    [key: number]: {
        id: string;
        kind: number;
    };
}

let globalWebSocket: WebSocket | null = null;
let eventQueue: any[] = [];
let isConnecting = false;
let retryCount = 0;
const MAX_RETRY = 5;

export const useNostr = () => {
    const ensureWebSocketConnection = (relayURL: string) => {
        if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
            if (!isConnecting) {
                isConnecting = true;
                console.log(`Attempting to connect to WebSocket at ${relayURL}`);
                globalWebSocket = new WebSocket(relayURL);

                globalWebSocket.onopen = () => {
                    console.log('WebSocket connection opened');
                    isConnecting = false;
                    retryCount = 0;
                    // Send any queued events
                    while (eventQueue.length > 0) {
                        const event = eventQueue.shift();
                        sendEvent(event);
                    }
                };

                globalWebSocket.onerror = (err) => {
                    console.error('WebSocket error:', err);
                };

                globalWebSocket.onclose = (event) => {
                    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                    globalWebSocket = null;
                    isConnecting = false;
                    if (retryCount < MAX_RETRY) {
                        retryCount++;
                        setTimeout(() => ensureWebSocketConnection(relayURL), 1000 * Math.pow(2, retryCount));
                    } else {
                        console.error('Max retry attempts reached. Please check your connection.');
                    }
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
            }
        }
    };

    const sendEvent = (event: any) => {
        if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify(['EVENT', event]);
            globalWebSocket.send(message);
            console.log('Event sent to relay:', message);
        } else {
            console.log('WebSocket not ready, queueing event');
            eventQueue.push(event);
        }
    };

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

                ensureWebSocketConnection(relayURL);
                sendEvent(signedEvent);

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

        ensureWebSocketConnection(relayURL);

        const subscriptionId = `sub-${Math.random().toString(36).substr(2, 9)}`;

        const subscribe = () => {
            if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                const message = JSON.stringify(['REQ', subscriptionId, { kinds }]);
                globalWebSocket.send(message);
                console.log(`Subscribed to events of kinds: ${kinds.join(', ')}`);
            } else {
                console.log('WebSocket not ready, retrying subscription in 1 second');
                setTimeout(subscribe, 1000);
            }
        };

        subscribe();

        const messageHandler = (event: MessageEvent) => {
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

        globalWebSocket?.addEventListener('message', messageHandler);

        return () => {
            console.log('Unsubscribing from events');
            if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                globalWebSocket.send(JSON.stringify(['CLOSE', subscriptionId]));
            }
            globalWebSocket?.removeEventListener('message', messageHandler);
        };
    };

    return { signAndSendEvent, subscribeToEvents };
};
