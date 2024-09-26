let globalWebSocket: WebSocket | null = null;
let eventQueue: any[] = [];
let isConnecting = false;
let retryCount = 0;
const MAX_RETRY = 5;

export const useNostr = () => {
    const ensureWebSocketConnection = (relayURL: string): Promise<WebSocket> => {
        return new Promise((resolve, reject) => {
            if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                resolve(globalWebSocket);
                return;
            }

            if (isConnecting) {
                // Wait for the existing connection attempt
                const checkConnection = setInterval(() => {
                    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                        clearInterval(checkConnection);
                        resolve(globalWebSocket);
                    }
                }, 100);
                return;
            }

            isConnecting = true;
            console.log(`Attempting to connect to WebSocket at ${relayURL}`);

            const ws = new WebSocket(relayURL);

            ws.onopen = () => {
                console.log('WebSocket connection opened');
                globalWebSocket = ws;
                isConnecting = false;
                retryCount = 0;
                resolve(ws);

                // Send any queued events
                while (eventQueue.length > 0) {
                    const event = eventQueue.shift();
                    sendEvent(event);
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                isConnecting = false;
                reject(err);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                globalWebSocket = null;
                isConnecting = false;
                retryConnection(relayURL);
            };

            ws.onmessage = (msg) => {
                console.log('Received message from relay:', msg.data);
                try {
                    const parsedMsg = JSON.parse(msg.data);
                    console.log('Parsed message:', parsedMsg);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };
        });
    };

    const retryConnection = (relayURL: string) => {
        if (retryCount < MAX_RETRY) {
            retryCount++;
            const delay = 1000 * Math.pow(2, retryCount);
            console.log(`Retrying connection in ${delay}ms (attempt ${retryCount})`);
            setTimeout(() => ensureWebSocketConnection(relayURL), delay);
        } else {
            console.error('Max retry attempts reached. Please check your connection.');
        }
    };

    const sendEvent = async (event: any) => {
        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
            throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }

        try {
            const ws = await ensureWebSocketConnection(relayURL);
            const message = JSON.stringify(['EVENT', event]);
            ws.send(message);
            console.log('Event sent to relay:', message);
        } catch (error) {
            console.error('Error sending event:', error);
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
                await sendEvent(signedEvent);
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

        ensureWebSocketConnection(relayURL).then((ws) => {
            const subscriptionId = `sub-${Math.random().toString(36).substr(2, 9)}`;
            const message = JSON.stringify(['REQ', subscriptionId, { kinds }]);
            ws.send(message);
            console.log(`Subscribed to events of kinds: ${kinds.join(', ')}`);

            ws.addEventListener('message', (event) => {
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
            });
        }).catch((error) => {
            console.error('Error connecting to WebSocket:', error);
        });

        return () => {
            console.log('Unsubscribing from events');
            if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
                globalWebSocket.send(JSON.stringify(['CLOSE', subscriptionId]));
            }
        };
    };

    return { signAndSendEvent, subscribeToEvents };
};
