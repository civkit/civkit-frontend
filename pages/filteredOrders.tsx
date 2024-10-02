import { useState, useEffect } from 'react';
import { useNostr } from './useNostr';

interface NostrEvent {
  id: string;
  content: string;
  kind: number;
  created_at: number;
  pubkey: string;
  tags: string[][];
}

const FilteredOrders = () => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();

  useEffect(() => {
    console.log("useEffect triggered");

    const dummyEvent = { kind: 1, content: "Initializing connection" };
    console.log("Signing event to initialize connection:");
    signAndSendEvent(dummyEvent)
      .then(() => {
        console.log("Event signed successfully");
        setIsSigned(true);
      })
      .catch((error) => {
        console.error("Error signing event:", error);
      });

    const handleEventReceived = (event: NostrEvent) => {
      console.log('Event received:', event);
      setEvents((prevEvents) => {
        // Check if the event ID already exists in the previous events
        const eventExists = prevEvents.some((prevEvent) => prevEvent.id === event.id);
        if (eventExists) {
          console.log(`Event with ID ${event.id} already exists. Skipping.`);
          return prevEvents;
        }
        const newEvents = [...prevEvents, event];
        console.log("Events after adding new event:", newEvents);
        return newEvents;
      });
    };

    console.log("Subscribing to all events");
    const unsubscribe = subscribeToEvents(handleEventReceived);
    console.log("Subscribed to all events");

    return () => {
      console.log("Unsubscribing from events");
      unsubscribe();
    };
  }, [signAndSendEvent, subscribeToEvents]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">All Events</h2>
        {isSigned ? (
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-bold mb-2 text-gray-700">Event ID: {event.id}</h3>
                  <p className="text-gray-700">Kind: {event.kind}</p>
                  <p className="text-gray-700">Created At: {new Date(event.created_at * 1000).toLocaleString()}</p>
                  <p className="text-gray-700">Pubkey: {event.pubkey}</p>
                  <p className="text-gray-700 break-all">Content: {event.content}</p>
                  <div className="mt-2">
                    <p className="text-gray-700 font-semibold">Tags:</p>
                    {event.tags.map((tag, index) => (
                      <p key={index} className="text-gray-600 ml-2">{JSON.stringify(tag)}</p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-700">No events found.</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-700">Signing event, please wait...</p>
        )}
      </div>
    </div>
  );
};

export default FilteredOrders;
