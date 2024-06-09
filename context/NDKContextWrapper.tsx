"use client"
import { NDKProvider } from '@nostr-dev-kit/ndk-react'
import React from 'react'
import { useNDK } from "@nostr-dev-kit/ndk-react";

function NDKContextWrapper({ children }: { children: React.ReactNode }) {
  if (typeof window === undefined){
    return
  }
  return (
    <NDKProvider relayUrls={["ws://localhost:8008"]}>
      {children}
    </NDKProvider>
  )
}

export default NDKContextWrapper