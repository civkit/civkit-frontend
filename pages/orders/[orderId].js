"use client";
import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { NDKContext } from '../../components/NDKContext';

const OrderDetails = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [makerHoldInvoice, setMakerHoldInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [isMakerHoldPaid, setIsMakerHoldPaid] = useState(false);
  const [isFullPaid, setIsFullPaid] = useState(false);
  const [isSigning, setIsSigning] = useState(false); // Flag to prevent multiple sign attempts
  const ndk = useContext(NDKContext);

  const fetchOrder = async () => {
    try {
      console.log(`Fetching order with ID: ${orderId}`);
      const orderResponse = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOrder(orderResponse.data);
      console.log('Order Response:', orderResponse.data);

      console.log(`Fetching invoices for order ID: ${orderId}`);
      const invoicesResponse = await axios.get(`http://localhost:3000/api/invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Invoices Response:', invoicesResponse.data);

      const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [invoicesResponse.data];

      console.log('Processed Invoices:', invoices);

      const makerHold = invoices.find(invoice => invoice.invoice_type === 'hold' && (!invoice.user_type || invoice.user_type === ''));
      const fullInv = invoices.find(invoice => invoice.invoice_type === 'full' && invoice.user_type === '');

      setMakerHoldInvoice(makerHold);
      setFullInvoice(fullInv);

      console.log('Maker Hold Invoice:', makerHold);
      console.log('Full Invoice:', fullInv);
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash, type) => {
    try {
      console.log(`Checking invoice status for payment hash: ${paymentHash}`);
      const response = await axios.post('http://localhost:3000/api/holdinvoicelookup', {
        payment_hash: paymentHash,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log(`Invoice status response for ${type} invoice:`, response.data);

      if (response.data.state === 'ACCEPTED') {
        if (type === 'makerHold' && !isMakerHoldPaid) {
          setIsMakerHoldPaid(true);
          console.log('Maker hold invoice paid.');
          if (!isSigning) {
            await signAndBroadcastOrder('Maker hold invoice paid.');  // Sign and broadcast when the maker hold invoice is paid
          }
          if (order.type === 0) { // Buy Order
            router.push(`/submit-payout?orderId=${orderId}`);
          } else { // Sell Order
            router.push(`/full-invoice?orderId=${orderId}`);
          }
        }
        if (type === 'full' && !isFullPaid) {
          setIsFullPaid(true);
          console.log('Full invoice paid.');
          if (!isSigning) {
            await signAndBroadcastOrder('Full invoice paid.');
          }
        }
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  const signAndBroadcastOrder = async (statusMessage) => {
    if (isSigning) {
      console.log("Already signing, skipping this attempt.");
      return;
    }
    setIsSigning(true);

    try {
      if (!order || !window.nostr) {
        console.log("NDK or signer not ready.");
        setIsSigning(false);
        return;
      }

      console.log("Signing and broadcasting order...");

      const orderContent = {
        order_id: order.order_id,
        details: order.order_details,
        amount: order.amount_msat,
        currency: order.currency,
        payment_method: order.payment_method,
        status: statusMessage
      };

      const event = {
        kind: 1505, // Event kind set to 1505
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(orderContent),
      };

      try {
        const signedEvent = await window.nostr.signEvent(event);
        console.log('Signed Event:', signedEvent);

        // Send the signed event to your relay using WebSocket
        const relayURL = 'ws://localhost:7000'; // Change to your actual relay URL

        const relayWebSocket = new WebSocket(relayURL);

        relayWebSocket.onopen = () => {
          const message = JSON.stringify(['EVENT', signedEvent]);
          relayWebSocket.send(message);
          console.log('Signed event sent to relay:', message);
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
    } catch (error) {
      console.error('Error signing and publishing event:', error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleOpenChat = async () => {
    try {
      console.log(`Creating or checking chatroom for order ID: ${orderId}`);
      const response = await axios.post('http://localhost:3000/api/check-and-create-chatroom', {
        orderId,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Chatroom Response:', response.data);

      const { makeChatUrl, acceptChatUrl } = response.data;
      // Redirect based on the user's role
      if (order.type === 0 && makeChatUrl) { // Buyer
        router.push(makeChatUrl);
      } else if (order.type === 1 && acceptChatUrl) { // Seller
        router.push(acceptChatUrl);
      }
    } catch (error) {
      console.error('Error creating or checking chatroom:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (makerHoldInvoice && makerHoldInvoice.payment_hash) {
      const interval = setInterval(() => {
        checkInvoiceStatus(makerHoldInvoice.payment_hash, 'makerHold');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [makerHoldInvoice]);

  useEffect(() => {
    if (fullInvoice && fullInvoice.payment_hash) {
      const interval = setInterval(() => {
        checkInvoiceStatus(fullInvoice.payment_hash, 'full');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fullInvoice]);

  useEffect(() => {
    if (isFullPaid && !isSigning) {
      signAndBroadcastOrder('Full invoice paid.');
    }
  }, [isFullPaid]);

  if (!order) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg font-bold text-blue-600">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Order Details</h1>
        <p className="mb-4"><span className="font-bold text-gray-700">Order ID:</span> {order.order_id}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Details:</span> {order.order_details}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Amount:</span> {order.amount_msat}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Currency:</span> {order.currency}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Payment Method:</span> {order.payment_method}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Status:</span> {order.status}</p>

        {makerHoldInvoice && (
          <>
            <h2 className="text-xl font-bold mb-4 text-blue-600">Maker Hold Invoice</h2>
            <p className="mb-4 break-words"><span className="font-bold text-gray-700">Invoice (Hold):</span> {makerHoldInvoice.bolt11}</p>
            <div className="flex justify-center mb-4">
              <QRCode value={makerHoldInvoice.bolt11} />
            </div>
            <p className="mb-6"><span className="font-bold text-gray-700">Status:</span> {isMakerHoldPaid ? 'Paid' : 'Not Paid'}</p>
          </>
        )}

        {fullInvoice && (
          <>
            <h2 className="text-xl font-bold mb-4 text-blue-600">Full Amount Invoice</h2>
            <p className="mb-4 break-words"><span className="font-bold text-gray-700">Invoice (Full):</span> {fullInvoice.bolt11}</p>
            <div className="flex justify-center mb-4">
              <QRCode value={fullInvoice.bolt11} />
            </div>
            <p className="mb-6"><span className="font-bold text-gray-700">Status:</span> {isFullPaid ? 'Paid' : 'Not Paid'}</p>
          </>
        )}

        {order.status === 'chat_open' && (
          <div className="flex justify-center">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleOpenChat}
            >
              Open Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
