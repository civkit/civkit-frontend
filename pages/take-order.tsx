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
  const [fullInvoice, setFullInvoice] = useState(null);
  const [isTakerHoldPaid, setIsTakerHoldPaid] = useState(false);
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

      console.log(`Fetching taker invoices for order ID: ${orderId}`);
      const invoicesResponse = await axios.get(`http://localhost:3000/api/taker-invoice/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Invoices Response:', invoicesResponse.data);

      const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [invoicesResponse.data];

      console.log('Processed Invoices:', invoices);

      const takerHold = invoices.find(invoice => invoice.invoice_type === 'hold');
      const fullInv = invoices.find(invoice => invoice.invoice_type === 'full');

      setTakerHoldInvoice(takerHold);
      setFullInvoice(fullInv);

      console.log('Taker Hold Invoice:', takerHold);
      console.log('Full Invoice:', fullInv);
    } catch (error) {
      console.error('Error fetching order or invoice:', error);
    }
  };

  const checkInvoiceStatus = async (paymentHash, type) => {
    try {
      console.log(`Checking invoice status for payment hash: ${paymentHash}`);
      let response;
      if (type === 'full') {
        response = await axios.post('http://localhost:3000/api/fullinvoicelookup', {
          payment_hash: paymentHash,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      } else {
        response = await axios.post('http://localhost:3000/api/holdinvoicelookup', {
          payment_hash: paymentHash,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
      console.log(`Invoice status response for ${type} invoice:`, response.data);

      if (response.data.state === 'ACCEPTED') {
        if (type === 'takerHold') {
          setIsTakerHoldPaid(true);
        }
        if (type === 'full') {
          setIsFullPaid(true);
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
        status: statusMessage,
      };

      const event = {
        kind: 1506, // New event kind set to 1506 for taker events
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

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    if (takerHoldInvoice && takerHoldInvoice.payment_hash) {
      const interval = setInterval(() => {
        checkInvoiceStatus(takerHoldInvoice.payment_hash, 'takerHold');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [takerHoldInvoice]);

  useEffect(() => {
    if (fullInvoice && fullInvoice.payment_hash) {
      const interval = setInterval(() => {
        checkInvoiceStatus(fullInvoice.payment_hash, 'full');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [fullInvoice]);

  useEffect(() => {
    if (isTakerHoldPaid && !isSigning) {
      signAndBroadcastOrder('Taker hold invoice paid.');
      if (fullInvoice) {
        // Redirect to the full invoice display page when the taker hold invoice is paid
        router.push(`/full-invoice?orderId=${orderId}`);
      }
    }
  }, [isTakerHoldPaid, fullInvoice, orderId, router]);

  useEffect(() => {
    if (isFullPaid && !isSigning) {
      signAndBroadcastOrder('Full invoice paid.');
    }
  }, [isFullPaid]);

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

        {order.type === 1 && fullInvoice && (
          <>
            <h2 className="text-xl font-semibold mt-4">Full Amount Invoice</h2>
            <div className="bg-gray-100 p-2 rounded break-words">
              <p className="text-xs">{fullInvoice.bolt11}</p>
            </div>
            <div className="flex justify-center my-4">
              <QRCode value={fullInvoice.bolt11} />
            </div>
            <p>Status: {isFullPaid ? 'Paid' : 'Not Paid'}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TakeOrder;
