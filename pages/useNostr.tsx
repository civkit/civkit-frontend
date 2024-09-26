import { finalizeEvent, generateSecretKey, getPublicKey, SimplePool, Event } from 'nostr-tools'
import { useState, useEffect, useCallback } from 'react'

const pool = new SimplePool()
const relays = ['ws://64.7.199.19:7000'] // Add more relays as needed

export const useNostr = () => {
  const [secretKey, setSecretKey] = useState<Uint8Array | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  useEffect(() => {
    const sk = generateSecretKey()
    setSecretKey(sk)
    setPublicKey(getPublicKey(sk))
  }, [])

  const signAndSendEvent = useCallback(async (eventData: any) => {
    if (!secretKey) {
      console.error('Secret key not available')
      return
    }

    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(eventData),
    }

    const signedEvent = finalizeEvent(event, secretKey)

    try {
      const pubs = pool.publish(relays, signedEvent)
      await Promise.all(pubs)
      console.log('Event published successfully')
    } catch (error) {
      console.error('Failed to publish event:', error)
    }
  }, [secretKey])

  const subscribeToEvents = useCallback((onEventReceived: (event: Event) => void, kinds: number[] = [1]) => {
    const sub = pool.sub(relays, [{ kinds }])

    sub.on('event', (event: Event) => {
      console.log('Received event:', event)
      onEventReceived(event)
    })

    return () => {
      sub.unsub()
    }
  }, [])

  return { signAndSendEvent, subscribeToEvents, publicKey }
}
