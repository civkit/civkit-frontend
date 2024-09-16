import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useNostr } from './useNostr';
import { GiOstrich } from 'react-icons/gi';
import QRCode from 'qrcode.react';

const TakeOrder = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [takerHoldInvoice, setTakerHoldInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [nostrEventSent, setNostrEventSent] = useState(false);

  const { signAndSendEvent } = useNostr();

  useEffect(() => {
    if (orderId) {
      fetchOrderAndCreateInvoice();
      const intervalId = setInterval(() => checkHoldInvoiceStatus(), 5000);
      return () => clearInterval(intervalId);
    }
  }, [orderId]);

  const fetchOrderAndCreateInvoice = async () => {
    try {
      const orderResponse = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOrder(orderResponse.data);

      const invoiceResponse = await axios.post(`http://localhost:3000/api/taker-invoice/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Taker hold invoice:', invoiceResponse.data.holdInvoice);
      setTakerHoldInvoice(invoiceResponse.data.holdInvoice);
    } catch (error) {
      console.error('Error fetching order or creating taker hold invoice:', error);
      setError('Failed to fetch order or create taker hold invoice');
    }
  };

  const checkHoldInvoiceStatus = async () => {
    try {
      const paymentHash = takerHoldInvoice?.payment_hash;
      if (!paymentHash) {
        console.error('No payment hash available for taker hold invoice');
        return;
      }
      
      console.log('Checking status for taker hold invoice payment hash:', paymentHash);
      
      const response = await axios.post(
        `http://localhost:3000/api/holdinvoicelookup`,
        { payment_hash: paymentHash },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      const invoiceState = response.data.state;
      setTakerHoldInvoice(prevState => ({
        ...prevState,
        status: invoiceState
      }));
  
      if (invoiceState === 'ACCEPTED') {
        console.log('Taker hold invoice has been paid!');
        // Handle paid state (e.g., show success message, update UI)
      }
    } catch (error) {
      console.error('Error checking taker hold invoice status:', error);
    }
  };

  const sendNostrEvent = async () => {
    try {
      const nostrEventData = {
        order_id: orderId,
        amount_msat: order?.amount_msat,
        type: order?.type,
        status: 'taker_hold_invoice_paid',
        currency: order?.currency,
        payment_method: order?.payment_method
      };
      await signAndSendEvent(nostrEventData, 1507);
      setNostrEventSent(true);
      console.log('Nostr event sent successfully');
    } catch (error) {
      console.error('Error sending Nostr event:', error);
    }
  };

  const handleRedirect = () => {
    if (order) {
      if (order.type === 0) { // Buy order
        const fullUrl = `http://localhost:3001/full-invoice?orderid=${orderId}`;
        console.log('Redirecting to full invoice page:', fullUrl);
        window.location.href = fullUrl;
      } else { // Sell order (type === 1)
        const payoutUrl = `http://localhost:3001/submit-payout?orderId=${orderId}`;
        console.log('Redirecting to submit payout page:', payoutUrl);
        window.location.href = payoutUrl;
      }
    }
  };

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!order || !takerHoldInvoice) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6">Take Order</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Order Details</h2>
          <p className="mb-2"><span className="font-semibold">Order ID:</span> {order.order_id}</p>
          <p className="mb-2"><span className="font-semibold">Amount:</span> {order.amount_msat} msat</p>
          <p className="mb-2"><span className="font-semibold">Status:</span> {order.status}</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Taker Hold Invoice</h2>
          <div className="mb-4 flex justify-center">
            <QRCode value={takerHoldInvoice.bolt11} size={200} />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-sm font-mono break-all">{takerHoldInvoice.bolt11}</p>
          </div>
          <p className="mb-2"><span className="font-semibold">Amount:</span> {takerHoldInvoice.amount_msat} msat</p>
          <p className="mb-4">
            <span className="font-semibold">Status:</span>
            <span className={`ml-2 ${takerHoldInvoice.status === 'ACCEPTED' ? 'text-green-600' : 'text-yellow-600'}`}>
              {takerHoldInvoice.status}
            </span>
          </p>
          {takerHoldInvoice.status === 'ACCEPTED' && (
            <p className="text-green-600 font-semibold mb-4">Hold invoice has been paid! Proceeding with the order...</p>
          )}
          <button 
            onClick={() => checkHoldInvoiceStatus()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Refresh Invoice Status
          </button>
        </div>
        
        {takerHoldInvoice.status === 'ACCEPTED' && !nostrEventSent && (
          <button 
            onClick={sendNostrEvent}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
          >
            Send to Relay
          </button>
        )}

        {nostrEventSent && (
          <p className="text-green-500 font-bold mb-4">Nostr event sent successfully!</p>
        )}

        {takerHoldInvoice.status === 'ACCEPTED' && (
          <button 
            onClick={handleRedirect}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {order.type === 1 ? 'Go to Payout Page' : 'Go to Full Invoice'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TakeOrder;