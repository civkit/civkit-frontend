import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { NDKContext } from '../components/NDKContext';

const TakeOrder = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [takerHoldInvoice, setTakerHoldInvoice] = useState(null);
  const [isTakerHoldPaid, setIsTakerHoldPaid] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const ndk = useContext(NDKContext);

  const fetchOrder = async () => {
    try {
      const orderResponse = await axios.get(`http://localhost:3000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOrder(orderResponse.data);

      const invoicesResponse = await axios.get(`http://localhost:3000/api/taker-invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [invoicesResponse.data];
      const takerHold = invoices.find(invoice => invoice.invoice_type === 'hold');
      setTakerHoldInvoice(takerHold);
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash) => {
    try {
      const response = await axios.post('http://localhost:3000/api/holdinvoicelookup', {
        payment_hash: paymentHash,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.status === 'paid' || response.data.state === 'ACCEPTED') {
        setIsTakerHoldPaid(true);
        await fetchOrder();
      }
    } catch (error) {
      console.error('Error checking invoice status:', error);
    }
  };

  const signAndBroadcastOrder = async (statusMessage) => {
    if (isSigning) return;
    setIsSigning(true);

    try {
      if (!order || !window.nostr) {
        setIsSigning(false);
        return;
      }

      const orderContent = {
        order_id: order.order_id,
        details: order.order_details,
        amount: order.amount_msat,
        currency: order.currency,
        payment_method: order.payment_method,
        status: statusMessage,
      };

      const event = {
        kind: 1506,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(orderContent),
      };

      const signedEvent = await window.nostr.signEvent(event);
      const relayURL = 'ws://localhost:7000';
      const relayWebSocket = new WebSocket(relayURL);

      relayWebSocket.onopen = () => {
        const message = JSON.stringify(['EVENT', signedEvent]);
        relayWebSocket.send(message);
        console.log('Signed event sent to relay:', message);
      };
    } catch (error) {
      console.error('Error signing and publishing event:', error);
    } finally {
      setIsSigning(false);
    }
  };

  const createFullInvoice = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/full-invoice/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.data && response.data.invoice) {
        router.push(`/full-invoice?orderId=${orderId}`);
      } else {
        console.error('Failed to create full invoice:', response.data);
      }
    } catch (error) {
      console.error('Error creating full invoice:', error);
      // You might want to add some user feedback here, like setting an error state
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    let interval;
    if (takerHoldInvoice && takerHoldInvoice.payment_hash) {
      interval = setInterval(() => {
        checkInvoiceStatus(takerHoldInvoice.payment_hash);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [takerHoldInvoice]);

  useEffect(() => {
    if (isTakerHoldPaid && !isSigning) {
      signAndBroadcastOrder('Taker hold invoice paid.');
      if (order.type === 1) { // Sell order
        router.push(`/submit-payout?orderId=${orderId}`);
      } else { // Buy order
        createFullInvoice();
      }
    }
  }, [isTakerHoldPaid, order, orderId, router]);

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Order Details</h1>
        <p><span className="font-bold">Order ID:</span> {order.order_id}</p>
        <p><span className="font-bold">Details:</span> {order.order_details}</p>
        <p><span className="font-bold">Amount:</span> {order.amount_msat}</p>
        <p><span className="font-bold">Currency:</span> {order.currency}</p>
        <p><span className="font-bold">Payment Method:</span> {order.payment_method}</p>
        <p><span className="font-bold">Status:</span> {order.status}</p>
        <p><span className="font-bold">Order Type:</span> {order.type === 1 ? 'Sell' : 'Buy'}</p>

        {takerHoldInvoice && (
          <>
            <h2 className="text-xl font-semibold mt-4">Taker Hold Invoice</h2>
            <div className="bg-gray-100 p-2 rounded break-words">
              <p className="text-xs">{takerHoldInvoice.bolt11}</p>
            </div>
            <div className="flex justify-center my-4">
              <QRCode value={takerHoldInvoice.bolt11} />
            </div>
            <p>Status: {isTakerHoldPaid ? 'Paid' : 'Not Paid'}</p>
          </>
        )}

        <button 
          onClick={fetchOrder} 
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Order Status
        </button>
      </div>
    </div>
  );
};

export default TakeOrder;