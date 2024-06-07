import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const TakeOrder = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [takerHoldInvoice, setTakerHoldInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [isTakerHoldPaid, setIsTakerHoldPaid] = useState(false);
  const [isFullPaid, setIsFullPaid] = useState(false);

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

      if (response.data.state === 'accepted') {
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
    if (isTakerHoldPaid && fullInvoice) {
      // Redirect to the full invoice display page when the taker hold invoice is paid
      router.push(`/full-invoice?orderId=${orderId}`);
    }
  }, [isTakerHoldPaid, fullInvoice, orderId, router]);

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

      {takerHoldInvoice && (
        <>
          <h2>Taker Hold Invoice</h2>
          <p>Invoice (Hold): {takerHoldInvoice.bolt11}</p>
          <QRCode value={takerHoldInvoice.bolt11} />
          <p>Status: {isTakerHoldPaid ? 'Paid' : 'Not Paid'}</p>
        </>
      )}

      {order.type === 1 && fullInvoice && (
        <>
          <h2>Full Amount Invoice</h2>
          <p>Invoice (Full): {fullInvoice.bolt11}</p>
          <QRCode value={fullInvoice.bolt11} />
          <p>Status: {isFullPaid ? 'Paid' : 'Not Paid'}</p>
        </>
      )}
    </div>
  );
};

export default TakeOrder;
