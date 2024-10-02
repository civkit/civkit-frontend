"use client"
import React, { useContext, useEffect, useState } from 'react';
import { NDKContextWrapper } from './NDKContextWrapper';
import { NostrEvent } from '@nostr-dev-kit/ndk';

const FilteredOrders = () => {
    const ndk = useContext(NDKContext);
    const [orders, setOrders] = useState<NostrEvent[]>([]);

    useEffect(() => {
        // Subscribe to events of kind 1506
        const subscription = ndk.subscribe({ kinds: [1506], limit: 50 }); // Adjust the limit as needed

        subscription.on('event', (event: NostrEvent) => {
            // Add the event to the orders state
            setOrders(prevOrders => [...prevOrders, event]);
        });

        subscription.on('error', (error) => {
            console.error('Error fetching events:', error);
        });

        // Cleanup function to stop the subscription when the component unmounts
        return () => subscription.stop();
    }, [ndk]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Filtered Orders</h2>
                {orders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {orders.map((order, index) => {
                            // Prepare a modified event object for display
                            const modifiedOrder = {
                                id: order.id,
                                created_at: order.created_at,
                                kind: order.kind,
                                content: order.content,
                                tags: order.tags.map(tag => tag.join(": ")).join(", "),
                            };

                            return (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                                    <h3 className="text-lg font-bold mb-2 text-gray-700">Order ID: {modifiedOrder.id}</h3>
                                    <p className="text-gray-700">Created At: {new Date(modifiedOrder.created_at * 1000).toLocaleString()}</p>
                                    <p className="text-gray-700">Kind: {modifiedOrder.kind}</p>
                                    <p className="text-gray-700">Content: {modifiedOrder.content}</p>
                                    <p className="text-gray-700">Tags: {modifiedOrder.tags}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-700">No orders found.</p>
                )}
            </div>
        </div>
    );
};

export default FilteredOrders;
