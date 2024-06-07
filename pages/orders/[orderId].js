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

      if (response.data.state === 'accepted') {
        if (type === 'makerHold') {
          setIsMakerHoldPaid(true);
          if (order.type === 0) { // Buy Order
            router.push(`/submit-payout?orderId=${orderId}`);
          } else { // Sell Order
            router.push(`/full-invoice?orderId=${orderId}`);
          }
        }
        if (type === 'full') {
          setIsFullPaid(true);
          await signAndBroadcastOrder();
        }
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  const signAndBroadcastOrder = async () => {
    try {
      if (!order || !ndk || !ndk.signer) {
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
        status: 'Paid'
      };

      const ndkEvent = new NDKEvent(ndk);
      ndkEvent.kind = 1505; // Kind for order event
      ndkEvent.content = JSON.stringify(orderContent);

      await ndkEvent.sign();  // Explicitly sign the event
      await ndkEvent.publish();
      console.log('Published event:', ndkEvent);
    } catch (error) {
      console.error('Error signing and publishing event:', error);
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

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {order.order_id}</p>
      <p>Details: {order.order_details}</p>
      <p>Amount: {order.amount_msat}</p>
      <p>Currency: {order.currency}</p>
      <p>Payment Method: {order.payment_method}</p>
      <p>Status: {order.status}</p>

      {makerHoldInvoice && (
        <>
          <h2>Maker Hold Invoice</h2>
          <p>Invoice (Hold): {makerHoldInvoice.bolt11}</p>
          <QRCode value={makerHoldInvoice.bolt11} />
          <p>Status: {isMakerHoldPaid ? 'Paid' : 'Not Paid'}</p>
        </>
      )}

      {fullInvoice && (
        <>
          <h2>Full Amount Invoice</h2>
          <p>Invoice (Full): {fullInvoice.bolt11}</p>
          <QRCode value={fullInvoice.bolt11} />
          <p>Status: {isFullPaid ? 'Paid' : 'Not Paid'}</p>
        </>
      )}

      {order.status === 'chat_open' && (
        <button onClick={handleOpenChat}>Open Chat</button>
      )}
    </div>
  );
};

export default OrderDetails;
