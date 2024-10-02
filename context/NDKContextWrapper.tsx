"use client"
import { NDKProvider } from '@nostr-dev-kit/ndk-react'
import React from 'react'
import { useNDK } from "@nostr-dev-kit/ndk-react";

function NDKContextWrapper({ children }: { children: React.ReactNode }) {
  if (typeof window === undefined){
    return
  }
  const relayUrls = [
    "wss://civkit.africa", "wss://relay.damus.io"
  ];
  return (
    <NDKProvider relayUrls={relayUrls}>
      {children}
    </NDKProvider>
  )
}

export default NDKContextWrapper
