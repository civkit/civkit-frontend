"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const TradeComplete = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const orderResponse = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOrder(orderResponse.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const reviewData = {
        order_id: orderId,
        review,
        rating,
      };

      if (window.nostr) {
        const event = {
          kind: 1507, // Event kind for review
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify(reviewData),
        };

        try {
          const signedEvent = await window.nostr.signEvent(event);
          const relayURL = 'ws://localhost:7000'; // Change to your actual relay URL

          const relayWebSocket = new WebSocket(relayURL);

          relayWebSocket.onopen = () => {
            const message = JSON.stringify(['EVENT', signedEvent]);
            relayWebSocket.send(message);
            console.log('Signed event sent to relay:', message);
            setSuccessMessage('Review submitted successfully.');
          };

          relayWebSocket.onerror = (err) => {
            console.error('WebSocket error:', err);
          };

          relayWebSocket.onclose = () => {
            console.log('WebSocket connection closed');
          };
        } catch (signError) {
          console.error('Error signing event:', signError);
        }
      } else {
        console.error('nos2x extension is not available.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Trade Complete</h1>
        <p className="mb-4"><span className="font-bold text-gray-700">Order ID:</span> {order.order_id}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Details:</span> {order.order_details}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Amount:</span> {order.amount_msat}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Currency:</span> {order.currency}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Payment Method:</span> {order.payment_method}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Status:</span> {order.status}</p>

        <form onSubmit={handleReviewSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="review">Review</label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">Rating</label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="rating"
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
          <div className="flex items-center justify-between">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Submit Review
            </button>
          </div>
        </form>
        {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
      </div>
    </div>
  );
};

export default TradeComplete;