"use client";
import React, { createContext, useEffect, useState } from 'react';
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk';

export const NDKContext = createContext(null);

const NDKProvider = ({ children }) => {
    const [ndkInstance, setNdkInstance] = useState(null);

    useEffect(() => {
        const initializeNDK = async () => {
            try {
                console.log("Initializing NDK...");
                const ndk = new NDK({
                    explicitRelayUrls: ["ws://localhost:8080"],
                });
                await ndk.connect();
                console.log("NDK connected.");

                const signer = new NDKNip07Signer(ndk);
                await signer.blockUntilReady();
                console.log("NDK Signer ready.");

                ndk.signer = signer;
                setNdkInstance(ndk);
            } catch (error) {
                console.error("Error initializing NDK:", error);
            }
        };
        initializeNDK();
    }, []);

    return (
        <NDKContext.Provider value={ndkInstance}>
            {children}
        </NDKContext.Provider>
    );
};

export default NDKProvider;
