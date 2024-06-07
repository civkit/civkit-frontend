import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import QRCode from 'qrcode.react';

const OrderDetails = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [makerHoldInvoice, setMakerHoldInvoice] = useState(null);
  const [fullInvoice, setFullInvoice] = useState(null);
  const [isMakerHoldPaid, setIsMakerHoldPaid] = useState(false);
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

export default OrderDetails;
