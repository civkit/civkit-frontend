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
import FullInvoice from '../pages/full-invoice';

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

interface StepperState {
  currentStep: number;
  order: Order | null;
  makerHoldInvoice: Invoice | null;
  fullInvoice: any;
  invoiceStatus: string | null;
  orderStatus: string | null;
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
      setShowOrders(true);        // Show the orders table
      setShowMyOrders(false);     // Reset to Orders view
      setShowProfileSettings(false);
      setIsModalOpen(false);
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
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [currentStep]);

  const [isTakeOrderModalOpen, setIsTakeOrderModalOpen] = useState(false);
  const [takeOrderSteps, setTakeOrderSteps] = useState<string[]>([]);
  const [currentTakeOrderStep, setCurrentTakeOrderStep] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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
      'Fiat Received',  // Add this step for buy orders
      'Trade Complete', 
      'Order Completed 🚀'
    ];
    
    setTakeOrderSteps(order.type === 1 ? sellOrderSteps : buyOrderSteps);
    setCurrentTakeOrderStep(1);
    setSelectedOrder(order);
    setIsTakeOrderModalOpen(true);
  };
  const handleNextTakeOrderStep = () => {
    if (currentTakeOrderStep < takeOrderSteps.length) {
      setCurrentTakeOrderStep(currentTakeOrderStep + 1);
    } else {
      setIsTakeOrderModalOpen(false);
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
  if (!order) return;
  try {
    console.log('Checking full invoice status for order:', order.order_id);
    const response = await axios.post(
      // Change this line - use order.order_id instead of invoice.order_id
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-full-invoice/${order.order_id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    console.log('Status check response:', response.data);
    
    setFullInvoice(prevInvoice => ({
      ...prevInvoice,
      ...response.data.invoice
    }));

    if (response.data.invoice.status === 'paid') {
      setOrder(prevOrder => ({
        ...prevOrder!,
        status: 'paid'
      }));
      setCurrentStep(4);
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

  const saveStepperState = (orderId: number, state: StepperState) => {
    localStorage.setItem(`maker_order_${orderId}`, JSON.stringify(state));
  };

  const loadStepperState = (orderId: number): StepperState | null => {
    const saved = localStorage.getItem(`maker_order_${orderId}`);
    return saved ? JSON.parse(saved) : null;
  };

  // Add this useEffect to save state changes
  useEffect(() => {
    if (order && order.customer_id === parseInt(localStorage.getItem('userId'))) {
      const state: StepperState = {
        currentStep,
        order,
        makerHoldInvoice,
        fullInvoice,
        invoiceStatus,
        orderStatus
      };
      saveStepperState(order.order_id, state);
    }
  }, [currentStep, order, makerHoldInvoice, fullInvoice, invoiceStatus, orderStatus]);

  // Add this to your existing state declarations
  const [currentCustomerId, setCurrentCustomerId] = useState<number | null>(null);

  // Add this useEffect to fetch customer ID when component mounts
  useEffect(() => {
    const fetchCustomerId = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/my-orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.data && response.data.length > 0) {
          const makerOrder = response.data.find(order => order.customer_id);
          if (makerOrder) {
            setCurrentCustomerId(makerOrder.customer_id);
            localStorage.setItem('customer_id', makerOrder.customer_id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer_id:', error);
      }
    };

    if (!localStorage.getItem('customer_id')) {
      fetchCustomerId();
    }
  }, []); // Run once on mount

  const handleResumeOrder = async (order) => {
    try {
      // Get role from backend instead of local comparison
      const roleResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.order_id}/user-role`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const { isMaker, isTaker } = roleResponse.data;

      console.log('Resume Order Debug:', {
        roleResponse: roleResponse.data,
        order,
        isMaker,
        isTaker
      });

      if (isMaker) {
        // Maker flow
        setOrder(order);
        setCurrentStep(2);
        setIsModalOpen(true);
        setIsTakeOrderModalOpen(false);
        setShowOrders(false);
        
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoice/${order.order_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          
          const invoices = Array.isArray(response.data) ? response.data : [response.data];
          const makerHoldInvoice = invoices.find(
            (invoice) => invoice.invoice_type === 'hold' && invoice.user_type === 'maker'
          );
          
          if (makerHoldInvoice) {
            setMakerHoldInvoice(makerHoldInvoice);
          }
        } catch (error) {
          console.error('Failed to fetch invoice data:', error);
        }
      } else if (isTaker) {
        handleTakeOrder(order);
      } else {
        console.error('User is neither maker nor taker of this order');
      }
    } catch (error) {
      console.error('Failed to determine user role:', error);
    }
  };

  // Add this useEffect for polling full invoice status
  useEffect(() => {
    if (currentStep === 3 && order && fullInvoice && fullInvoice.status !== 'paid') {
      console.log('Starting full invoice polling');
      const interval = setInterval(() => {
        checkFullInvoice();
      }, 5000); // Check every 5 seconds
      
      return () => {
        console.log('Clearing full invoice polling');
        clearInterval(interval);
      };
    }
  }, [currentStep, order, fullInvoice]);

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
              <h1
                className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}
              >
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
          <div className='mb-4 flex flex-col items-center'>
            <ul className='mt-8 flex flex-col items-center justify-center gap-4'>
              <div className='mb-4 rounded-lg bg-gray-700 p-4 shadow-lg'>
                <li className='flex items-center justify-center gap-2'>
                  <span className='flex w-6 justify-center'>
                    <CgProfile className='text-xl text-white' />
                  </span>
                  <a
                    href='#'
                    className={`${darkMode ? 'text-white' : 'text-black'}`}
                    onClick={toggleProfileSettings}
                  >
                    {truncateNpub(npub)}
                  </a>
                  <FaChevronRight
                    className='cursor-pointer text-white'
                    onClick={toggleProfileSettings}
                  />
                </li>
              </div>
            </ul>
            <button
              onClick={handleLogout}
              className='w-36 rounded bg-red-500 p-2 text-white'
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleDrawer}
        className={`fixed top-12 z-10 bg-gray-500 p-1 ${isDrawerOpen ? 'left-56' : 'left-0'}`}
      >
        <LuPanelLeftOpen
          className={`transform transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div 
        className="fixed relative h-screen flex-1 bg-gray-100 p-8 dark:bg-gray-900"
        style={{ marginLeft: isDrawerOpen ? '15rem' : '0' }}
      >
        <div className='mb-6 mt-4 flex items-center justify-between'>
          <div className='relative ml-12 w-1/2'>
            <input
              type='text'
              placeholder='Find Order...'
              className='w-full rounded-lg border border-gray-300 p-2 pl-5'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <FaTimes
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer'
                onClick={() => setSearchQuery('')}
              />
            ) : (
              <FaSearch className='absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400' />
            )}
          </div>
          <div className='mr-12 flex items-center space-x-6'>
            <FaQuestionCircle className='cursor-pointer text-gray-600 dark:text-gray-300' />
            <FaBell className='cursor-pointer text-gray-600 dark:text-gray-300' />
            <button onClick={toggleDarkMode}>
              {darkMode ? (
                <FaSun className='text-yellow-500' />
              ) : (
                <FaMoon className='text-gray-600' />
              )}
            </button>
          </div>
        </div>

        <div className='mb-6 ml-12 flex items-center justify-between'>
          <h2
            className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
          >
            Welcome 👋
          </h2>
          <div className='mr-12 flex space-x-6'>
            <button
              className='flex w-36 items-center justify-center gap-2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600'
              disabled
            >
              <FaFilter />
              Filter
            </button>
            <button
              onClick={handleCreateOrderClick}
              className='flex w-36 items-center justify-center gap-2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600'
            >
              <FaPlus />
              Create Order
            </button>
          </div>
        </div>

        <hr className='mb-6' />

        {isModalOpen && (
          <div className='w-full rounded-lg bg-white p-4 shadow dark:bg-gray-800 flex flex-row justify-center mt-6'>
            <div className='flex flex-col justify-center items-center mb-2 mr-2 text-gray-700 dark:text-gray-200'>
              <div className='flex items-center justify-center mb-6'>
                {getSteps().map((step, index) => (
                  <React.Fragment key={index}>
                    <span
                      className={`cursor-pointer ${currentStep === index + 1 ? 'font-bold text-orange-500' : 'text-gray-500'}`}
                      onClick={() => setCurrentStep(index + 1)}
                    >
                      {step}
                    </span>
                    {index < getSteps().length - 1 && (
                      <FaChevronRight className='mx-2 text-gray-500' />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className='flex flex-col h-100 rounded-lg justify-center items-center gap-2'>
                {currentStep === 1 && <CreateOrderForm onOrderCreated={handleOrderCreated} />}
                {currentStep === 2 && order && makerHoldInvoice && (
                  <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
                    <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>Hold Invoice</h2>
                    <p className='mb-4 break-words'>
                      <span className='font-bold text-gray-700'>Invoice:</span> {makerHoldInvoice.bolt11}
                    </p>
                    <div className='mb-4 flex justify-center'>
                      <QRCode value={makerHoldInvoice.bolt11} size={200} />
                    </div>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Order ID:</span> {order.order_id}
                    </p>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Amount:</span> {order.amount_msat / 1000} sats
                    </p>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Order Status:</span> {order.status}
                    </p>
                    <button
                      onClick={() => checkInvoiceStatus(makerHoldInvoice.payment_hash)}
                      className='focus:shadow-outline rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                    >
                      Check Invoice Status
                    </button>
                    {order.status === 'paid' && (
                      <button
                        onClick={() => setCurrentStep(3)}
                        className='focus:shadow-outline mt-4 w-full rounded-lg bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600 focus:outline-none'
                      >
                        Next Step
                      </button>
                    )}
                  </div>
                )}
                {currentStep === 3 && order && (
                  <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
                    {order?.type === 1 ? (
                      <FullInvoice 
                        invoice={fullInvoice}
                        onCheckStatus={() => {
                          checkFullInvoice();
                          // Optional: Add feedback that status check is in progress
                          console.log('Checking invoice status...');
                        }}
                        loading={!fullInvoice}
                      />
                    ) : (
                      <SubmitPayout 
                        orderId={order.order_id.toString()}
                        onPayoutSubmitted={() => setCurrentStep(4)}
                      />
                    )}
                  </div>
                )}
                {currentStep === 4 && order && (
                  <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
                    <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>Make Offer</h2>
                    <div className='flex flex-col gap-4'>
                      <button
                        onClick={() => {
                          const makeOfferUrl = `${process.env.NEXT_PUBLIC_CHAT_URL}/ui/chat/make-offer?orderId=${order.order_id}`;
                          window.open(makeOfferUrl, '_blank');
                        }}
                        className='w-full rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600'
                      >
                        Make Chatroom Offer
                      </button>
                      <button
                        onClick={handleNextStep}
                        className='w-full rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {currentStep === 5 && order && (
                  <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
                    {order.type === 1 ? (
                      <FiatReceived 
                        orderId={order.order_id.toString()}
                        onComplete={() => setCurrentStep(6)}
                      />
                    ) : (
                      <TradeComplete 
                        orderId={order.order_id}
                        orderType={order.type}
                        onComplete={() => setCurrentStep(6)}
                      />
                    )}
                  </div>
                )}
                {currentStep === 6 && order && (
                  <TradeComplete 
                    orderId={order.order_id}
                    orderType={order.type}
                    onComplete={() => setCurrentStep(7)}
                  />
                )}
                {currentStep === 7 && (
                  <div className='w-full h-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4 flex items-center justify-center'>
                    <h1 className='text-2xl font-bold text-green-600'>Order Completed 🚀</h1>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
  {isTakeOrderModalOpen && (
        <div className='w-full rounded-lg bg-white p-4 shadow dark:bg-gray-800 flex flex-row justify-center mt-6'>
          <div className='flex flex-col justify-center items-center mb-2 mr-2 text-gray-700 dark:text-gray-200'>
            <div className='flex items-center justify-center mb-6'>
              {takeOrderSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <span
                    className={`cursor-pointer ${currentTakeOrderStep === index + 1 ? 'font-bold text-orange-500' : 'text-gray-500'}`}
                    onClick={() => setCurrentTakeOrderStep(index + 1)}
                  >
                    {step}
                  </span>
                  {index < takeOrderSteps.length - 1 && (
                    <FaChevronRight className='mx-2 text-gray-500' />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className='flex flex-col h-100 rounded-lg justify-center items-center gap-2'>
              {currentTakeOrderStep === 1 && selectedOrder && (
                <TakeOrder orderId={selectedOrder.order_id} />
              )}
              {currentTakeOrderStep === 2 && selectedOrder && (
                <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
                  {selectedOrder.type === 0 ? (  // Buy order
                    <TakerFullInvoice 
                      orderId={selectedOrder.order_id.toString()}
                      onComplete={handleNextTakeOrderStep}
                    />
                  ) : (  // Sell order
                    <SubmitPayout 
                      orderId={selectedOrder.order_id.toString()}
                      onPayoutSubmitted={handleNextTakeOrderStep}
                    />
                  )}
                </div>
              )}
              {currentTakeOrderStep === 3 && (
                <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4 flex flex-col items-center justify-center'>
                  <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>Chat</h2>
                  <button
                    onClick={handleOpenChat}
                    className='flex w-36 items-center justify-center gap-2 rounded-lg bg-green-500 p-2 text-white hover:bg-green-600'
                  >
                    Open Chat
                  </button>
                </div>
              )}
              {currentTakeOrderStep === 4 && selectedOrder && selectedOrder.type === 0 && (
                <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
                  <FiatReceived 
                    orderId={selectedOrder.order_id.toString()}
                    onComplete={handleNextTakeOrderStep}
                  />
                </div>
              )}
              {currentTakeOrderStep === takeOrderSteps.length - 1 && selectedOrder && (
                <TradeComplete 
                  orderId={selectedOrder.order_id}
                  orderType={selectedOrder.type}
                  onComplete={handleNextTakeOrderStep}
                />
              )}
              {currentTakeOrderStep === takeOrderSteps.length && (
                <div className='w-full h-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4 flex items-center justify-center'>
                  <h1 className='text-2xl font-bold text-green-600'>Order Completed 🚀</h1>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


        {!isTakeOrderModalOpen && showOrders && (
          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <h3 className='mb-4 ml-12 text-lg font-semibold text-gray-700 dark:text-gray-200'>
              {showMyOrders ? 'My Orders' : 'Available Orders (Pending)'}
            </h3>
            {currentOrdersPageData.length > 0 ? (
              <div
                className={`overflow-y-auto ${isTableScrollable ? 'max-h-96' : ''}`}
              >
                <table
                  className='ml-12 bg-white dark:bg-gray-800'
                  style={{ width: '156vh' }}
                >
                  <thead>
                    <tr className='text-gray-700 dark:text-gray-200'>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Order ID
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Order Details
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700'>
                        Amount (sats)
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Currency
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Payment Method
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Status
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                        Order Type
                      </th>
                      <th className='border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='text-gray-700 dark:text-gray-200'>
                    {currentOrdersPageData.map((order) => (
                      <React.Fragment key={order.order_id}>
                        <tr className='h-13 odd:bg-gray-100 even:bg-white dark:odd:bg-gray-700 dark:even:bg-gray-800'>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.order_id}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.order_details}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700'>
                            {(order.amount_msat / 1000).toFixed(3)}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.currency}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.payment_method}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.status}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            {order.type === 0 ? 'Buy' : 'Sell'}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700'>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleRowExpansion(order.order_id)}
                              >
                                {expandedRow === order.order_id ? (
                                  <BsChevronUp className='text-xl' />
                                ) : (
                                  <BsChevronDown className='text-xl' />
                                )}
                              </button>
                              {showMyOrders && order.status !== 'completed' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // Get role from backend instead of local comparison
                                      const roleResponse = await axios.get(
                                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.order_id}/user-role`,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                                          },
                                        }
                                      );

                                      const { isMaker, isTaker } = roleResponse.data;

                                      console.log('Resume Order Debug:', {
                                        roleResponse: roleResponse.data,
                                        order,
                                        isMaker,
                                        isTaker
                                      });

                                      if (isMaker) {
                                        // Maker flow
                                        setOrder(order);
                                        setCurrentStep(2);
                                        setIsModalOpen(true);
                                        setIsTakeOrderModalOpen(false);
                                        setShowOrders(false);
                                        
                                        try {
                                          const response = await axios.get(
                                            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoice/${order.order_id}`,
                                            {
                                              headers: {
                                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                                              },
                                            }
                                          );
                                          
                                          const invoices = Array.isArray(response.data) ? response.data : [response.data];
                                          const makerHoldInvoice = invoices.find(
                                            (invoice) => invoice.invoice_type === 'hold' && invoice.user_type === 'maker'
                                          );
                                          
                                          if (makerHoldInvoice) {
                                            setMakerHoldInvoice(makerHoldInvoice);
                                          }
                                        } catch (error) {
                                          console.error('Failed to fetch invoice data:', error);
                                        }
                                      } else if (isTaker) {
                                        handleTakeOrder(order);
                                      } else {
                                        console.error('User is neither maker nor taker of this order');
                                      }
                                    } catch (error) {
                                      console.error('Failed to determine user role:', error);
                                    }
                                  }}
                                  className='inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                >
                                  Resume Order
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedRow === order.order_id && (
                          <tr>
                            <td
                              colSpan={8}
                              className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'
                            >
                              <div className='rounded bg-gray-100 p-4 dark:bg-gray-700'>
                                <table className='min-w-full bg-white dark:bg-gray-800'>
                                  <tbody>
                                    <tr>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        Customer ID
                                      </td>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        {order.customer_id}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        Escrow Status
                                      </td>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        {order.escrow_status}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        Taker Customer ID
                                      </td>
                                      <td className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                                        {order.taker_customer_id}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                {!showMyOrders && order.customer_id !== localStorage.getItem('userId') && (
                                  <button
                                    className='focus:shadow-outline mt-2 rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                                    onClick={() => handleTakeOrder(order)}
                                  >
                                    Take Order
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-center text-gray-700'>No orders found.</p>
            )}
            <div className='mt-4 flex items-center justify-center'>
              {currentOrdersPage > 1 && (
                <button
                  onClick={handlePreviousPageClick}
                  className='mx-1 rounded bg-orange-500 px-3 py-1 text-white'
                >
                  <FaChevronLeft className='text-white' />
                </button>
              )}
              <span className='mx-2 text-gray-700 dark:text-gray-200'>
                Page {currentOrdersPage} of {totalOrdersPages}
              </span>
              <button
                onClick={handleNextPageClick}
                className={`mx-1 rounded px-3 py-1 ${
                  currentOrdersPage === totalOrdersPages
                    ? 'cursor-not-allowed bg-orange-300'
                    : 'bg-orange-500 text-white'
                }`}
                disabled={currentOrdersPage === totalOrdersPages}
              >
                <FaChevronRight className='rounded-lg text-white' />
              </button>
            </div>
          </div>
        )}

        {!isTakeOrderModalOpen && !isModalOpen && showRatings && (
          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <h3 className='mb-4 ml-12 text-lg font-semibold text-gray-700 dark:text-gray-200'>
              Ratings
            </h3>
            <div className='ml-12'>
              <Ratings />
            </div>
          </div>
        )}

        {!isTakeOrderModalOpen && showProfileSettings && (
          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <h3 className='mb-4 ml-12 text-lg font-semibold text-white'>
              Profile Settings
            </h3>
            <div className='ml-12 space-y-4'>
              <div>
                <label htmlFor='npub' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  Username
                </label>
                <input
                  type='text'
                  id='npub'
                  value={npub || ''}
                  readOnly
                  className='w-full rounded-lg border border-gray-300 p-2 pl-5 text-gray-700'
                />
              </div>
              <div>
                <label htmlFor='relay' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  Relay URL
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='text'
                  id='relay'
                  value={relayInput}
                  onChange={(e) => setRelayInput(e.target.value)}
                    className='w-full rounded-lg border border-gray-300 p-2 pl-5 text-gray-700'
                  />
                <button
                  onClick={handleSaveRelay}
                  className='focus:shadow-outline w-16 rounded-lg bg-green-600 px-2 py-2 font-bold text-white hover:bg-green-700 focus:outline-none'
                >
                  Save
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chatUrls && (
          <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
            <div className='rounded-lg bg-white p-8 shadow'>
              <h2 className='mb-4 text-center text-2xl font-bold text-blue-600'>
                Chatroom URLs
              </h2>
              <p className='text-gray-700'>
                <strong>Make Offer URL:</strong>
                <a
                  href={chatUrls.makeOfferUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-500 underline'
                >
                  {chatUrls.makeOfferUrl}
                </a>
              </p>
              {chatUrls.acceptOfferUrl && (
                <p className='text-gray-700'>
                  <strong>Accept Offer URL:</strong>
                  <a
                    href={chatUrls.acceptOfferUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-500 underline'
                  >
                    {chatUrls.acceptOfferUrl}
                  </a>
                </p>
              )}
              <button
                className='focus:shadow-outline mt-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;