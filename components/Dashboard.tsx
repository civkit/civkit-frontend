import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  FaBell,
  FaMoon,
  FaSun,
  FaCog,
  FaFileInvoice,
  FaFilter,
  FaPlus,
  FaQuestionCircle,
  FaChevronRight,
  FaChevronLeft,
  FaSearch,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaStar,
} from 'react-icons/fa';
import {
  BsJournalBookmarkFill,
  BsChevronDown,
  BsChevronUp,
} from 'react-icons/bs';
import { CgProfile } from 'react-icons/cg';
import { MdOutlinePayments } from 'react-icons/md';
import { RxDashboard } from 'react-icons/rx';
import { LuPanelLeftOpen } from 'react-icons/lu';
import axios from 'axios';
import { useNostr } from '../pages/useNostr';
import { useRouter } from 'next/router';
import Modal from './Modal';
import CreateOrderForm from './CreateOrderForm';
import dynamic from 'next/dynamic';
import { FaCircleChevronDown } from 'react-icons/fa6';
import QRCode from 'qrcode.react';
import { useClearStorageOnLoad } from '../hooks/useClearStorageOnLoad';
import { decode } from 'bolt11';
import SubmitPayout from '../pages/submit-payout';
import FiatReceived from '../pages/fiat-received';
import TradeComplete from '../pages/trade-complete';
import TakerFullInvoice from '../pages/taker-full-invoice';
import Ratings from '../pages/Ratings';

// Dynamically import the OrderDetails component
const OrderDetails = dynamic(() => import('../pages/orders/[orderId]'), {
  ssr: false, // Disable server-side rendering if not needed
});

const FullInvoice = dynamic(() => import('../pages/full-invoice'), {
  ssr: false, // Disable server-side rendering if not needed
});

// Dynamically import the TakeOrder component
const TakeOrder = dynamic(() => import('../pages/take-order'), {
  ssr: false, // Disable server-side rendering if not needed
});

// Define the Order interface
interface Order {
  order_id: number;
  order_details: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'Pending' | 'chat_open' | 'taker_found' | string;
  type: number;
}

interface HoldInvoice {
  invoice: string;
  order_id: number;
}

interface Invoice {
  bolt11: string;
  payment_hash: string;
  status: string;
}

const Dashboard: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}> = ({ darkMode, toggleDarkMode }) => {
  useClearStorageOnLoad();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showOrderbookLinks, setShowOrderbookLinks] = useState<boolean>(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 10;
  const maxPageButtons = 5;
  const [selectedOrderbook, setSelectedOrderbook] = useState<string | null>(
    null
  );
  const router = useRouter();
  const [chatUrls, setChatUrls] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [showProfileSettings, setShowProfileSettings] =
    useState<boolean>(false);
  const [showOrders, setShowOrders] = useState<boolean>(false);
  const [isTableScrollable, setIsTableScrollable] = useState<boolean>(false);

  const [npub, setNpub] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNpub(localStorage.getItem('npub'));
    }
  }, []);

  const [confirmationStatus, setConfirmationStatus] = useState<string>('');
  const [relayUrl, setRelayUrl] = useState<string>(
    process.env.NEXT_PUBLIC_NOSTR_RELAY || ''
  );

  const [searchQuery, setSearchQuery] = useState<string>(''); // New state for search query

  const truncateNpub = (npub: string | null, length: number = 6) => {
    if (!npub) return 'Profile';
    return npub.length > length ? `${npub.substring(0, length)}...` : npub;
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  // Instead of using filteredOrders as state, create a computed value
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order?.order_details) return false;
      return order.order_details.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [orders, searchQuery]);

  const currentOrders = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);

  // New state variables for orderbook pagination
  const [currentOrderbookPage, setCurrentOrderbookPage] = useState<number>(1);
  const orderbooksPerPage = 5; // Adjust as needed

  const indexOfLastOrderbook = currentOrderbookPage * orderbooksPerPage;
  const indexOfFirstOrderbook = indexOfLastOrderbook - orderbooksPerPage;
  const currentOrderbooks = filteredOrders.slice(
    indexOfFirstOrderbook,
    indexOfLastOrderbook
  );

  const totalOrderbookPages = Math.ceil(filteredOrders.length / orderbooksPerPage);

  // State variables for orders pagination
  const [currentOrdersPage, setCurrentOrdersPage] = useState<number>(1);
  const ordersPerPage = 10;

  const indexOfLastOrder = currentOrdersPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrdersPageData = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleOrdersPageClick = (pageNumber: number) => {
    setCurrentOrdersPage(pageNumber);
  };

  const getOrdersPageNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(
      1,
      currentOrdersPage - Math.floor(maxPageButtons / 2)
    );
    const endPage = Math.min(totalOrdersPages, startPage + maxPageButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const handleOrderbookPageClick = (pageNumber: number) => {
    setCurrentOrderbookPage(pageNumber);
  };

  const getOrderbookPageNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(
      1,
      currentOrderbookPage - Math.floor(maxPageButtons / 2)
    );
    const endPage = Math.min(
      totalOrderbookPages,
      startPage + maxPageButtons - 1
    );

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const toggleRowExpansion = (orderId: number) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
    setIsTableScrollable(expandedRow !== orderId); // Toggle scrollbar visibility
  };

  // Add these state variables at the top with your other states
  const [showMyOrders, setShowMyOrders] = useState(false);

  // Update the Orders button click handler
  const handleOrdersClick = async () => {
    try {
      setShowOrders(true);        
      setShowMyOrders(false);     
      setShowProfileSettings(false);
      setIsModalOpen(false);
      setIsTakeOrderModalOpen(false);
      setCurrentOrdersPage(1);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const pendingOrders = response.data.filter(
        (order: Order) => 
          (order.status === 'pending' || order.status === 'Pending') &&
          order.status !== 'chat_open' &&
          order.status !== 'taker_found'
      );
      
      setOrders(pendingOrders);
    } catch (error) {
      console.error('Error handling orders click:', error);
    }
  };

  // Update the My Orders button click handler
  const handleMyOrdersClick = async () => {
    try {
      setShowOrders(true);
      setShowMyOrders(true);
      setShowProfileSettings(false);
      setIsModalOpen(false);
      setIsTakeOrderModalOpen(false);
      setCurrentOrdersPage(1);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setOrders(response.data);
    } catch (error) {
      console.error('Error handling my orders click:', error);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setOrders(response.data.orders || response.data);
        // Remove this line:
        // await checkAndCreateChatrooms(response.data.orders || response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);


  const handleOpenChat = async () => {
    const currentOrder = order || selectedOrder;
    if (!currentOrder?.order_id) {
      console.error('No order ID available');
      alert('Unable to open chat: Order ID not available');
      return;
    }

    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accept-offer-url/${currentOrder.order_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
      );

      if (data.url) {
        // Replace localhost:3456 with NEXT_PUBLIC_CHAT_URL, removing any protocol prefix
        const chatUrl = data.url.replace('http://localhost:3456', process.env.NEXT_PUBLIC_CHAT_URL);
        window.open(chatUrl, '_blank');
      } else {
        const { data: makeOfferData } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-make-offer`,
          { orderId: currentOrder.order_id },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (makeOfferData.makeOfferUrl) {
          window.open(makeOfferData.makeOfferUrl, '_blank');
        } else {
          alert('Chat URL not available');
        }
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      alert(`Failed to open chat: ${error.response?.data?.message || error.message}`);
    }
  };

  const closeModal = () => {
    setChatUrls(null);
  };

  useEffect(() => {
    const dummyEvent = { kind: 1, content: 'Initializing connection' };
    signAndSendEvent(dummyEvent)
      .then(() => setIsSigned(true))
      .catch((error) => console.error('Error signing event:', error));

    const handleEventReceived = (event: any) => {
      if (!event || !event.content) return;
      try {
        const parsedContent = JSON.parse(event.content);
        setOrders(prevOrders => {
          if (prevOrders.some((order) => order.order_id === parsedContent.order_id)) {
            return prevOrders;
          }
          return [...prevOrders, parsedContent];
        });
      } catch (error) {
        console.error('Error parsing event content:', error);
      }
    };

    const unsubscribe = subscribeToEvents(handleEventReceived, [1506]);
    return () => unsubscribe();
  }, [signAndSendEvent, subscribeToEvents]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('npub');
    window.location.href = '/';
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handlePreviousPageClick = () => {
    if (currentOrdersPage > 1) {
      setCurrentOrdersPage(currentOrdersPage - 1);
    }
  };

  const handleNextPageClick = () => {
    if (currentOrdersPage < totalOrdersPages) {
      setCurrentOrdersPage(currentOrdersPage + 1);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false);
  const [currentTakeOrderStep, setCurrentTakeOrderStep] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNpub(localStorage.getItem('npub'));
      
      const savedStep = localStorage.getItem('currentStep');
      const savedOrderId = localStorage.getItem('currentOrderId');
      const savedOrder = localStorage.getItem('currentOrder');
      const savedTakeOrderStep = localStorage.getItem('currentTakeOrderStep');
      const savedSelectedOrder = localStorage.getItem('selectedOrder');
      
      if (savedStep && savedOrderId) {
        setCurrentStep(parseInt(savedStep));
      }
      if (savedOrder) {
        setOrder(JSON.parse(savedOrder));
      }
      if (savedTakeOrderStep) {
        setCurrentTakeOrderStep(parseInt(savedTakeOrderStep));
      }
      if (savedSelectedOrder) {
        setSelectedOrder(JSON.parse(savedSelectedOrder));
        setIsTakeOrderModalOpen(true);
      }
    }
  }, []);

  const [makerHoldInvoice, setMakerHoldInvoice] = useState<Invoice | null>(null);
  const [fullInvoice, setFullInvoice] = useState<any>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [lnInvoice, setLnInvoice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const checkInvoiceStatus = async (paymentHash: string): Promise<string | null> => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/holdinvoicelookup`,
        { payment_hash: paymentHash },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const invoiceState = response.data.state;

      if (invoiceState === 'ACCEPTED') {
        setOrder((prevOrder) => ({ ...prevOrder!, status: 'paid' }));
        
        if (order) {
          axios.put(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.order_id}`,
            { status: 'paid' },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          ).catch(() => {});
        }
      }
      return invoiceState;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (makerHoldInvoice?.payment_hash && order) {
      const interval = setInterval(async () => {
        const newState = await checkInvoiceStatus(makerHoldInvoice.payment_hash);
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

  const handleOrderCreated = async (createdOrder: Order, holdInvoice: string) => {
    setOrder(createdOrder);
    const invoicesResponse = await axios.get<Invoice[]>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoice/${createdOrder.order_id}`,
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

    setCurrentStep(2);
  };

  const handleCreateOrderClick = () => {
    setIsModalOpen(true);
    setShowOrders(false);
    setShowProfileSettings(false);
    setShowRatings(false);
  };

  const toggleProfileSettings = () => {
    setShowProfileSettings(!showProfileSettings);
    setIsModalOpen(false); // Hide create order form
    setShowOrders(false); // Hide orders table
  };

  const [relayInput, setRelayInput] = useState<string>(relayUrl);

  const handleSaveRelay = () => {
    setRelayUrl(relayInput);
    localStorage.setItem('relayUrl', relayInput);
    alert('Relay URL saved successfully!');
  };

  const getSteps = () => {
    if (!order) {
      return ['Create Order', 'Hold Invoice', 'Full Invoice', 'Chat', 'Trade Complete', 'Order Completed 🚀'];
    }
    return order.type === 1  // Sell Order
      ? ['Create Order', 'Hold Invoice', 'Full Invoice', 'Chat', 'Fiat Received', 'Trade Complete', 'Order Completed 🚀']
      : ['Create Order', 'Hold Invoice', 'Submit Payout', 'Chat', 'Trade Complete', 'Order Completed 🚀'];
  };

  const handleNextStep = () => {
    if (currentStep < getSteps().length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (order) {
        localStorage.setItem(`makerStep_${order.order_id}`, nextStep.toString());
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    // Check for saved order first
    const savedOrderId = localStorage.getItem('currentOrderId');
    if (savedOrderId) {
      fetchOrderDetails(savedOrderId);
    }
    
    // Then check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId && orderId !== savedOrderId) {
      fetchOrderDetails(orderId);
    }
  }, []);

  useEffect(() => {
    if (order) {
      localStorage.setItem('currentOrder', JSON.stringify(order));
      localStorage.setItem('currentOrderId', order.order_id.toString());
    }
  }, [order]);

  useEffect(() => {
    if (currentStep > 1) {
      localStorage.setItem('currentStep', currentStep.toString());
    }
  }, [currentStep]);

  const [takeOrderSteps, setTakeOrderSteps] = useState<string[]>([]);

  const handleTakeOrder = (order: any) => {
    const sellOrderSteps = [
      'Hold Invoice', 
      'Submit Payout', 
      'Chat', 
      'Trade Complete', 
      'Order Completed 🚀'
    ];
    const buyOrderSteps = [
      'Hold Invoice', 
      'Full Invoice', 
      'Chat',
      'Fiat Received',
      'Trade Complete', 
      'Order Completed 🚀'
    ];
    
    setTakeOrderSteps(order.type === 1 ? sellOrderSteps : buyOrderSteps);
    setCurrentTakeOrderStep(1);
    setSelectedOrder(order);
    setIsTakeOrderModalOpen(true);
    
    // Save to localStorage
    localStorage.setItem('selectedOrder', JSON.stringify(order));
    localStorage.setItem('isTakeOrderModalOpen', 'true');
    localStorage.setItem('currentTakeOrderStep', '1');
  };
  const handleNextTakeOrderStep = () => {
    if (currentTakeOrderStep < takeOrderSteps.length) {
      const nextStep = currentTakeOrderStep + 1;
      setCurrentTakeOrderStep(nextStep);
      if (selectedOrder) {
        localStorage.setItem(`takerStep_${selectedOrder.order_id}`, nextStep.toString());
      }
    } else {
      setIsTakeOrderModalOpen(false);
      if (selectedOrder) {
        localStorage.removeItem(`takerStep_${selectedOrder.order_id}`);
      }
    }
  };

  const handlePreviousTakeOrderStep = () => {
    if (currentTakeOrderStep > 1) {
      setCurrentTakeOrderStep(currentTakeOrderStep - 1);
    }
  };

  useEffect(() => {
    // Reset all relevant state here
    setOrder(null);
    setMakerHoldInvoice(null);
    setCurrentStep(1);
    // ... reset any other state variables
  }, []); // Empty dependency array means this runs once on mount

  const validateInvoice = (invoice: string, orderAmountMsat: number) => {
    try {
      console.log('Invoice to validate:', invoice);
      console.log('Order amount (msat):', orderAmountMsat);

      if (!invoice.startsWith('lntbs')) {
        throw new Error('Invalid invoice: Not a Signet invoice');
      }

      // Extract the amount from the invoice manually
      const amountMatch = invoice.match(/lntbs(\d+)([pnum]?)/i);
      if (!amountMatch) {
        throw new Error('Unable to extract amount from invoice');
      }

      const [, amountStr, unit] = amountMatch;
      let invoiceAmountMsat = BigInt(amountStr);

      // Convert to millisatoshis based on the unit
      switch (unit.toLowerCase()) {
        case 'p':
          invoiceAmountMsat *= BigInt(10); // pico-BTC to msat
          break;
        case 'n':
          invoiceAmountMsat *= BigInt(100); // nano-BTC to msat
          break;
        case 'u':
          invoiceAmountMsat *= BigInt(100000); // micro-BTC to msat
          break;
        case 'm':
          invoiceAmountMsat *= BigInt(100000000); // milli-BTC to msat
          break;
        case '':
          invoiceAmountMsat *= BigInt(1000); // sats to msat
          break;
        default:
          throw new Error('Unsupported amount unit in invoice');
      }

      console.log('Extracted invoice amount (msat):', invoiceAmountMsat.toString());

      const orderAmountMsatBigInt = BigInt(orderAmountMsat);

      // Allow a small tolerance (e.g., 1%) for amount mismatch
      const tolerance = orderAmountMsatBigInt * BigInt(1) / BigInt(100);
      if (invoiceAmountMsat < orderAmountMsatBigInt - tolerance || invoiceAmountMsat > orderAmountMsatBigInt + tolerance) {
        throw new Error(`Invoice amount (${invoiceAmountMsat} msat) does not match order amount (${orderAmountMsatBigInt} msat)`);
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      throw new Error(`Invalid invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmitPayout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!order) {
      setErrorMessage('Order details not available');
      return;
    }

    try {
      validateInvoice(lnInvoice, order.amount_msat);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payouts/submit`,
        {
          order_id: order.order_id,
          ln_invoice: lnInvoice,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.message) {
        setSuccessMessage('Payout submitted successfully.');
        setTimeout(() => {
          setCurrentStep(4); // Move to the next step (Full Invoice)
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error submitting payout:', error);
    }
  };

  const fetchFullInvoice = async (orderId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/full-invoice/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Full invoice data:', response.data);
      setFullInvoice(response.data.invoice);
    } catch (error) {
      console.error('Error fetching full invoice:', error);
    }
  };

  useEffect(() => {
    if (currentStep === 3 && order && order.type === 1) {
      fetchFullInvoice(order.order_id.toString());
    }
  }, [currentStep, order]);

  const checkFullInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-full-invoice/${selectedOrder.order_id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Check full invoice response:', response.data);
      if (response.data && response.data.status) {
        setFullInvoice((prevInvoice) => ({
          ...prevInvoice,
          status: response.data.status,
        }));
      }
    } catch (error) {
      console.error('Error checking full invoice:', error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const [showRatings, setShowRatings] = useState<boolean>(false);

  const determineUserRole = (order: Order): 'maker' | 'taker' | null => {
    const userId = localStorage.getItem('userId');
    if (order.customer_id === userId) return 'maker';
    if (order.taker_customer_id === userId) return 'taker';
    return null;
  };

  const handleComplete = () => {
    localStorage.removeItem('currentStep');
    localStorage.removeItem('currentOrder');
    localStorage.removeItem('currentOrderId');
    // ... rest of completion logic
  };

  useEffect(() => {
    console.log('Current orders:', orders); // Add this debug log
    
    const pollOrders = setInterval(async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/my-orders`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        
        const newOrders = response.data;
        console.log('New orders data:', newOrders); // Add this debug log
        
        orders.forEach(existingOrder => {
          const newOrder = newOrders.find(
            (o: Order) => o.order_id === existingOrder.order_id
          );
          
          if (newOrder && 
              newOrder.status === 'taker_found' && 
              existingOrder.status !== 'taker_found' &&
              newOrder.customer_id === parseInt(localStorage.getItem('userId'))) {
            console.log('Notification condition met:', { // Add this debug log
              orderId: newOrder.order_id,
              oldStatus: existingOrder.status,
              newStatus: newOrder.status,
              isMaker: newOrder.customer_id === parseInt(localStorage.getItem('userId'))
            });
            
            setNotifications(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              message: `Your order #${newOrder.order_id} has been taken!`,
              type: 'success'
            }]);
          }
        });
        
        setOrders(newOrders);
      } catch (error) {
        console.error('Error polling orders:', error);
      }
    }, 5000);

    return () => clearInterval(pollOrders);
  }, [orders]);

  // Add helper function to determine if order is in progress
  const isOrderInProgress = (order: Order) => {
    const savedOrderId = localStorage.getItem('currentOrderId');
    const savedTakeOrderId = localStorage.getItem('selectedOrder') 
      ? JSON.parse(localStorage.getItem('selectedOrder')!).order_id 
      : null;
    
    return order.order_id === parseInt(savedOrderId!) || order.order_id === savedTakeOrderId;
  };

  // Add with other state declarations
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>>([]);

  // Add this helper function near your other utility functions
  const getOrderStatus = (order: Order, userId: string | null) => {
    const isMaker = order.customer_id.toString() === userId;
    const orderStep = isMaker ? 
      localStorage.getItem(`makerStep_${order.order_id}`) : 
      localStorage.getItem(`takerStep_${order.order_id}`);
    
    if (orderStep) {
      return `In Progress (Step ${orderStep})`;
    }
    return order.status;
  };

  return (
    <div className={`flex ${darkMode ? 'dark' : ''}`}>
      {isDrawerOpen && (
        <div className="fixed flex h-screen w-60 flex-col justify-between bg-gray-800 p-4 text-white">
          <div>
            <div className='relative mt-6 flex flex-col items-center justify-center gap-2'>
              <Image
                src='/hachiko-logo.svg'
                alt='CivKit Logo'
                width={40}
                height={40}
              />
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                CivKit
              </h1>
            </div>
            
            <nav>
              <hr className='my-8' />
              <div className='flex flex-col items-center justify-center gap-8'>
                <div>
                  <button
                    onClick={handleOrdersClick}
                    className='mb-2 flex w-full items-center rounded-lg p-2 hover:bg-gray-700'
                  >
                    <RxDashboard className='mr-3' />
                    Orders
                  </button>

                  <button
                    onClick={handleMyOrdersClick}
                    className='mb-2 flex w-full items-center rounded-lg p-2 hover:bg-gray-700'
                  >
                    <BsJournalBookmarkFill className='mr-3' />
                    My Orders
                  </button>

                  <button
                    onClick={() => {
                      setShowRatings(true);
                      setShowOrders(false);
                      setShowMyOrders(false);
                      setShowProfileSettings(false);
                      setIsModalOpen(false);
                    }}
                    className="mb-2 flex w-full items-center rounded-lg p-2 hover:bg-gray-700"
                  >
                    <FaStar className="mr-3" />
                    Ratings
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Rest of your component remains the same */}
    </div>
  );
};

export default Dashboard;