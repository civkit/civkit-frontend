'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { nip19 } from 'nostr-tools';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

interface TradeCompleteProps {
  orderId: number;
  orderType: number;
  onComplete: () => void;
}

interface Order {
  order_id: number;
  order_details: string;
  amount_msat: number;
  currency: string;
}

const TradeComplete: React.FC<TradeCompleteProps> = ({ orderId: propOrderId, orderType, onComplete }) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Use orderId from URL if available, otherwise use the prop
  const orderId = router.query.orderId ? parseInt(router.query.orderId as string) : propOrderId;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      console.log('orderId', orderId);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const orderResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setOrder(orderResponse.data);
      console.log('order', orderResponse.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Define the review data for our backend
      const reviewData = {
        order_id: orderId,
        remarks: review,
        rating: parseInt(rating.toString())
      };

      // First submit to our backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ratings/${orderId}`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Then handle the Nostr part
      if (window.nostr) {
        const pubkey = await window.nostr.getPublicKey();
        const npub = nip19.npubEncode(pubkey);
        
        // Create Nostr-specific event data
        const nostrReviewData = {
          order_id: orderId,
          review,
          rating,
          reviewer_npub: npub,
          order_type: orderType,
          // Use order data directly to determine who to rate
          rated_user_npub: order?.order?.taker_customer_id 
            ? order.order.taker_customer_id 
            : order.order.customer_id
        };

        const event = {
          kind: 1508,
          created_at: Math.floor(Date.now() / 1000),
          tags: [
            ['e', 'review'],
            ['p', order?.order?.taker_customer_id?.toString() || ''],
            ['maker', order?.order?.customer_id?.toString() || ''],
            ['order', orderId.toString()]
          ],
          content: JSON.stringify(nostrReviewData),
          pubkey: npub,
        };

        console.log('Event before signing:', event);

        try {
          const signedEvent = await window.nostr.signEvent(event);
          console.log('Event after signing:', signedEvent);
          const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;

          const relayWebSocket = new WebSocket(relayURL);

          relayWebSocket.onopen = () => {
            const message = JSON.stringify(['EVENT', signedEvent]);
            relayWebSocket.send(message);
            console.log('Signed event sent to relay:', message);
            setSuccessMessage('Review submitted successfully.');
            relayWebSocket.close();
          };

          relayWebSocket.onerror = (err) => {
            console.error('WebSocket error:', err);
            setSuccessMessage('Error submitting review to Nostr. Database update successful.');
          };

          relayWebSocket.onclose = () => {
            console.log('WebSocket connection closed');
          };

          setTimeout(() => {
            if (relayWebSocket.readyState === WebSocket.CONNECTING) {
              relayWebSocket.close();
              setSuccessMessage('Nostr connection timeout. Database update successful.');
            }
          }, 5000);
        } catch (signError) {
          console.error('Error signing event:', signError);
          setSuccessMessage('Review saved to database. Nostr update failed.');
        }
      } else {
        setSuccessMessage('Review saved successfully. Nostr extension not available.');
      }

      toast.success('Review submitted successfully.');
    } catch (error) {
      console.error('Error submitting review:', error);
      setSuccessMessage('Error submitting review. Please try again.');
      toast.error('Error submitting review');
    }
  };

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg'>
        <h1 className='mb-6 text-center text-2xl font-bold text-blue-600'>
          Trade Complete
        </h1>
        {order && (
          <>
            <p className='mb-4'>
              <span className='font-bold text-gray-700'>Order ID:</span>{' '}
              {order.order.order_id}
            </p>
            <p className='mb-4'>
              <span className='font-bold text-gray-700'>Details:</span>{' '}
              {order.order.order_details}
            </p>
            <p className='mb-4'>
              <span className='font-bold text-gray-700'>Amount:</span>{' '}
              {order.order.amount_msat}
            </p>
            <p className='mb-4'>
          <span className='font-bold text-gray-700'>Currency:</span>{' '}
              {order.order.currency}
            </p>
            <p className='mb-4'>
              <span className='font-bold text-gray-700'>Payment Method:</span>{' '}
              {order.order.payment_method}
            </p>
            <p className='mb-4'>
              <span className='font-bold text-gray-700'>Status:</span>{' '}
              {order.order.status}
            </p>
          </>
        )}

        <form onSubmit={handleReviewSubmit}>
          <div className='mb-4'>
            <label
              className='mb-2 block text-sm font-bold text-gray-700'
              htmlFor='review'
            >
              Review
            </label>
            <textarea
              className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
              id='review'
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />
          </div>
          <div className='mb-4'>
            <label
              className='mb-2 block text-sm font-bold text-gray-700'
              htmlFor='rating'
            >
              Rating
            </label>
            <select
              className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
              id='rating'
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              required
            >
              <option value={0}>Select Rating</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div className='flex items-center justify-between'>
            <button
              className='focus:shadow-outline rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
              type='submit'
            >
              Submit Review
            </button>
          </div>
        </form>
        {successMessage && (
          <p className='mt-4 text-green-500'>{successMessage}</p>
        )}
        <button
          onClick={onComplete}
          className='mt-4 w-full rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600 focus:outline-none focus:shadow-outline'
        >
          Finish Order
        </button>
      </div>
    </div>
  );
};

export default TradeComplete;
