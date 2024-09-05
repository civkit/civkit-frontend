"use client";
import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { NDKContext } from '../../components/NDKContext';

type Order = {
  order_id: number;
  order_details: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  status: string;
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

const OrderDetails: React.FC = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [makerHoldInvoice, setMakerHoldInvoice] = useState<Invoice | null>(null);
  const [fullInvoice, setFullInvoice] = useState<Invoice | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const ndk = useContext(NDKContext);

  const fetchOrder = async () => {
    try {
      console.log(`Fetching order with ID: ${orderId}`);
      const orderResponse = await axios.get<Order>(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Received order data:', orderResponse.data);
      setOrder(orderResponse.data);

      console.log(`Fetching invoices for order ID: ${orderId}`);
      const invoicesResponse = await axios.get<Invoice[]>(`http://localhost:3000/api/invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Received invoices data:', invoicesResponse.data);

      const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [invoicesResponse.data];
      const holdInvoice = invoices.find(invoice => invoice.invoice_type === 'hold');
      console.log('Setting hold invoice:', holdInvoice);
      setMakerHoldInvoice(holdInvoice || null);

      console.log(`Order type: ${orderResponse.data.type}`);
      if (orderResponse.data.type === 1) {
        console.log('This is a sell order.');
      } else {
        console.log('This is a buy order.');
      }
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash: string): Promise<boolean> => {
    try {
      console.log(`Checking invoice status for payment hash: ${paymentHash}`);
      const response = await axios.post(`http://localhost:3000/api/holdinvoicelookup`, {
        payment_hash: paymentHash,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Full response data:', response.data);
      
      const invoiceState = response.data.state;
      console.log(`Invoice state: ${invoiceState}`);

      if (invoiceState === 'accepted' || invoiceState === 'paid') {
        console.log(`Invoice accepted or paid for order type ${order?.type}`);
        if (order?.type === 1) {
          const fullUrl = `http://localhost:3001/full-invoice?orderid=${orderId}`;
          console.log('Attempting to redirect to:', fullUrl);
          
          // Try multiple redirection methods
          window.location.href = fullUrl;
          window.location.replace(fullUrl);
          window.open(fullUrl, '_self');
          
          // If all else fails, create a link and click it
          const link = document.createElement('a');
          link.href = fullUrl;
          link.target = '_self';
          document.body.appendChild(link);
          link.click();
          
          console.log('Redirection attempts completed');
          return true;
        } else {
          console.log('This is a buy order, no redirection needed.');
        }
        return true;
      } else {
        console.log(`Invoice not accepted or paid. Current state: ${invoiceState}`);
        return false;
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
      return false;
    }
  };

  const signAndBroadcastOrder = async (statusMessage: string) => {
    if (isSigning) {
      console.log("Already signing, skipping this attempt.");
      return;
    }
    setIsSigning(true);

    try {
      if (!order || !window.nostr) {
        console.log("NDK or signer not ready.");
        return;
      }

      console.log("Signing and broadcasting order...");

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

        const relayURL = 'ws://localhost:7000';
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
      const response = await axios.post(`http://localhost:3000/api/check-and-create-chatroom`, {
        orderId,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Chatroom Response:', response.data);

      const { makeChatUrl, acceptChatUrl } = response.data;
      if (order?.type === 0 && makeChatUrl) { // Buyer
        console.log(`Redirecting to ${makeChatUrl}`);
        router.push(makeChatUrl);
      } else if (order?.type === 1 && acceptChatUrl) { // Seller
        console.log(`Redirecting to ${acceptChatUrl}`);
        router.push(acceptChatUrl);
      }
    } catch (error) {
      console.error('Error creating or checking chatroom:', error);
    }
  };

  const [manualTrigger, setManualTrigger] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);
  
  useEffect(() => {
    if (makerHoldInvoice?.payment_hash && order) {
      const interval = setInterval(() => {
        checkInvoiceStatus(makerHoldInvoice.payment_hash, 'makerHold');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [makerHoldInvoice, order]);
  
  useEffect(() => {
    if (fullInvoice?.payment_hash && order) {
      const interval = setInterval(() => {
        checkInvoiceStatus(fullInvoice.payment_hash, 'full');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fullInvoice, order]);

  useEffect(() => {
    if (manualTrigger > 0 && makerHoldInvoice?.payment_hash) {
      console.log('Manual check triggered');
      checkInvoiceStatus(makerHoldInvoice.payment_hash);
    }
  }, [manualTrigger]);

  const forceRedirect = () => {
    const fullUrl = `http://localhost:3001/full-invoice?orderid=${orderId}`;
    console.log('Forcing redirect to:', fullUrl);
    window.location.href = fullUrl;
  };

  if (!order) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg font-bold text-blue-600">Loading...</p></div>;
  }

  console.log('Rendering order:', order);
  console.log('Order type:', order.type);
  console.log('Hold invoice:', makerHoldInvoice);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Order Details</h1>
        <p className="mb-4"><span className="font-bold text-gray-700">Order ID:</span> {order.order_id}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Type:</span> {order.type === 0 ? 'Buy' : 'Sell'}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Details:</span> {order.order_details}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Amount:</span> {order.amount_msat}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Currency:</span> {order.currency}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Payment Method:</span> {order.payment_method}</p>
        <p className="mb-4"><span className="font-bold text-gray-700">Status:</span> {order.status}</p>

        {makerHoldInvoice && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-600">Hold Invoice</h2>
            <p className="mb-4 break-words"><span className="font-bold text-gray-700">Invoice:</span> {makerHoldInvoice.bolt11}</p>
            <div className="flex justify-center mb-4">
              <QRCode value={makerHoldInvoice.bolt11} />
            </div>
            <p className="mb-6"><span className="font-bold text-gray-700">Status:</span> {makerHoldInvoice.status}</p>
          </div>
        )}

        {!makerHoldInvoice && (
          <div>
            <p className="mb-4 text-red-600">No hold invoice available for this order.</p>
          </div>
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

        <button onClick={() => setManualTrigger(prev => prev + 1)}>
          Check Invoice Status Manually
        </button>

        <button onClick={forceRedirect}>Force Redirect to Full Invoice</button>
      </div>
    </div>
  );
};

export default OrderDetails;
