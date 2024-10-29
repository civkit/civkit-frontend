'use client';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { NDKContext } from '../../components/NDKContext';
import { useNostr } from '../useNostr';
import { FaMoon, FaSun } from 'react-icons/fa';
import { Spinner } from '../../components';

type Order = {
  order_id: number;
  order_details: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'paid' | 'chat_open' | 'completed' | string;
  type: number;
};

type Invoice = {
  invoice_id: number;
  order_id: number;
  bolt11: string;
  amount_msat: string;
  description: string;
  status: string | null;
  created_at: Date;
  expires_at: Date;
  payment_hash: string;
  invoice_type: string;
  user_type: string | null;
};

type NostrEvent = {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey?: string;
  id?: string;
  sig?: string;
};

const OrderDetails: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}> = ({ darkMode, toggleDarkMode }) => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [makerHoldInvoice, setMakerHoldInvoice] = useState<Invoice | null>(
    null
  );
  const [isSigning, setIsSigning] = useState(false);
  const ndk = useContext(NDKContext);

  const { signAndSendEvent } = useNostr();

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const orderResponse = await axios.get<Order>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Fetched order:', orderResponse.data);
      setOrder(orderResponse.data);

      const invoicesResponse = await axios.get<Invoice[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoice/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Received invoices data:', invoicesResponse.data);

      const invoices = Array.isArray(invoicesResponse.data)
        ? invoicesResponse.data
        : [invoicesResponse.data];

      const makerHoldInvoice = invoices.find(
        (invoice) => invoice.invoice_type === 'hold' && invoice.user_type === 'maker'
      );

      if (makerHoldInvoice) {
        console.log('Setting maker hold invoice:', makerHoldInvoice);
        setMakerHoldInvoice(makerHoldInvoice);
      } else {
        console.log('No maker hold invoice found');
      }
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (
    paymentHash: string
  ): Promise<string | null> => {
    try {
      console.log(`Checking invoice status for payment hash: ${paymentHash}`);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/holdinvoicelookup`,
        {
          payment_hash: paymentHash,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Full response data:', response.data);

      const invoiceState = response.data.state;
      console.log(`Invoice state: ${invoiceState}`);

      if (invoiceState === 'ACCEPTED') {
        console.log(`Invoice accepted for order type ${order?.type}`);

        // Update the order status in the state
        setOrder((prevOrder) => ({ ...prevOrder!, status: 'paid' }));

        // Update the order status in the database
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order?.order_id}`,
          {
            status: 'paid',
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } else {
        console.log(`Invoice not accepted. Current state: ${invoiceState}`);
      }
      return invoiceState;
    } catch (error) {
      console.error(`Error checking invoice status:`, error);
      return null;
    }
  };

  const signAndBroadcastOrder = async (statusMessage: string) => {
    if (isSigning) {
      console.log('Already signing, skipping this attempt.');
      return;
    }
    setIsSigning(true);

    try {
      if (!order || !window.nostr) {
        console.log('NDK or signer not ready.');
        return;
      }

      console.log('Signing and broadcasting order...');

      const orderContent = {
        order_id: order.order_id,
        details: order.order_details,
        amount: order.amount_msat,
        currency: order.currency,
        payment_method: order.payment_method,
        status: statusMessage,
      };

      const event: NostrEvent = {
        kind: 1505,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(orderContent),
      };

      try {
        const signedEvent = await window.nostr.signEvent(event);
        console.log('Signed Event:', signedEvent);

        const relayURL = process.env.NEXT_PUBLIC_NOSTR_RELAY;
        if (!relayURL) {
          throw new Error('NEXT_PUBLIC_NOSTR_RELAY is not defined');
        }
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-and-create-chatroom`,
        {
          orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Chatroom Response:', response.data);

      const { makeChatUrl, acceptChatUrl } = response.data;
      if (order?.type === 0 && makeChatUrl) {
        // Buyer
        console.log(`Redirecting to ${makeChatUrl}`);
        router.push(makeChatUrl);
      } else if (order?.type === 1) {
        // Seller
        // Query the database for the latest accept chat URL
        const latestUrlResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/latest-accept-chat-url`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const latestAcceptChatUrl = latestUrlResponse.data.url; // Assuming the response contains the URL
        console.log(`Redirecting to ${latestAcceptChatUrl}`);
        router.push(latestAcceptChatUrl);
      }
    } catch (error) {
      console.error('Error creating or checking chatroom:', error);
    }
  };

  const [manualTrigger, setManualTrigger] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId as string);
      const interval = setInterval(fetchOrderDetails, 10000, orderId as string); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  useEffect(() => {
    if (makerHoldInvoice?.payment_hash && order) {
      const interval = setInterval(async () => {
        const newState = await checkInvoiceStatus(
          makerHoldInvoice.payment_hash
        );
        if (newState) {
          setMakerHoldInvoice((prevInvoice) => ({
            ...prevInvoice!,
            status: newState,
          }));
          if (newState === 'ACCEPTED') {
            clearInterval(interval);
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [makerHoldInvoice, order]);

  useEffect(() => {
    if (manualTrigger > 0 && makerHoldInvoice?.payment_hash) {
      console.log('Manual check triggered');
      checkInvoiceStatus(makerHoldInvoice.payment_hash);
    }
  }, [manualTrigger, makerHoldInvoice]);

  const handleManualCheck = () => {
    if (makerHoldInvoice?.payment_hash) {
      checkInvoiceStatus(makerHoldInvoice.payment_hash);
    }
    {
      console.error('No invoice available to check');
    }
  };

  const handleRedirect = () => {
    if (order) {
      if (order.type === 0 && order.status === 'paid') {
        // Buy order with paid hold invoice
        console.log('Redirecting to submit payout page');
        router.push(`/submit-payout?orderId=${orderId}`);
      } else if (order.type === 1 && order.status === 'paid') {
        // Sell order
        const fullUrl = `http://localhost:3001/full-invoice?orderid=${orderId}`;
        console.log('Redirecting to full invoice page:', fullUrl);
        window.location.href = fullUrl;
      }
    }
  };

  const handleSendNostrEvent = async () => {
    if (order) {
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        'https://frontend.civkit.africa';
      const eventData = {
        order_id: order.order_id,
        status: order.status,
        amount_msat: order.amount_msat,
        currency: order.currency,
        payment_method: order.payment_method,
        type: order.type,
        frontend_url: `${frontendUrl}/take-order?orderId=${order.order_id}`,
      };
      await signAndSendEvent(eventData);
    }
  };
  useEffect(() => {
    console.log('Order state updated:', order);
    console.log('MakerHoldInvoice state updated:', makerHoldInvoice);
  }, [order, makerHoldInvoice]);

  console.log('Rendering order:', order);
  console.log('Order type:', order?.type);
  console.log('Hold invoice:', makerHoldInvoice);

  console.log('Current order state:', order);

  return (
    <div className='flex h-full w-full max-w-md flex-col gap-4 rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
      <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>
        Order Details
      </h2>
      <span className='font-bold text-gray-700'>Order ID:</span> {order?.order_id}
      <span className='font-bold text-gray-700 '>Type:</span>{' '}
      {order?.type === 0 ? 'Buy' : 'Sell'}
      <span className='font-bold text-gray-700'>Details:</span> {order?.order_details}
      <span className='font-bold text-gray-700'>Amount:</span> {order?.amount_msat}
      <span className='font-bold text-gray-700'>Currency:</span> {order?.currency}
      <span className='font-bold text-gray-700'>Payment Method:</span>{' '}
      {order?.payment_method}
      <span className='font-bold text-gray-700'>Invoice Status:</span> {order?.status}

      {makerHoldInvoice && (
        <div>
          <h2 className='mb-4 text-xl font-bold'>Hold Invoice</h2>
          <p className='mb-4 break-words'>
            <span className='font-bold text-gray-700'>Invoice:</span>{' '}
            {makerHoldInvoice.bolt11}
          </p>
          <div className='mb-4 flex justify-center'>
            <QRCode value={makerHoldInvoice.bolt11} size={200} />
          </div>
        </div>
      )}

      {!makerHoldInvoice && (
        <div>
          <p className='mb-4 text-red-600'>
            No hold invoice available for this order.
          </p>
        </div>
      )}

      <div className='flex justify-center gap-4'>
        {order?.type === 1 && order?.status === 'paid' && (
          <button
            onClick={handleRedirect}
            className='focus:shadow-outline rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
          >
            Go to Full Invoice
          </button>
        )}

        {order?.type === 0 && order?.status === 'paid' && (
          <button
            onClick={handleRedirect}
            className='focus:shadow-outline rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
          >
            Submit Payout
          </button>
        )}

        <button
          onClick={handleManualCheck}
          className='focus:shadow-outline rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-gray-600 focus:outline-none'
        >
          Check Invoice Status
        </button>
      </div>

      {order?.status === 'paid' && (
        <div className='mt-4 flex justify-center'>
          <button
            onClick={handleSendNostrEvent}
            className='focus:shadow-outline rounded-lg bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600 focus:outline-none'
          >
            Send to Nostr
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
