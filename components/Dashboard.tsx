import React, { useState, useEffect } from 'react';
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

// Dynamically import the OrderDetails component
const OrderDetails = dynamic(() => import('../pages/orders/[orderId]'), {
  ssr: false, // Disable server-side rendering if not needed
});
const SubmitPayout = dynamic(() => import('../pages/submit-payout'), {
  ssr: false, // Disable server-side rendering if not needed
});

const FullInvoice = dynamic(() => import('../pages/full-invoice'), {
  ssr: false, // Disable server-side rendering if not needed
});

// Dynamically import the TakeOrder component
const TakeOrder = dynamic(() => import('../pages/take-order'), {
  ssr: false, // Disable server-side rendering if not needed
});

const TakerFullInvoice = dynamic(() => import('../pages/taker-full-invoice'), {
  ssr: false, // Disable server-side rendering if not needed
});

// Define the Order interface
interface Order {
  order_id: number;
  order_details: string;
  amount_msat: number;
  currency: string;
  payment_method: string;
  status: string;
  type: number;
}

const Dashboard: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}> = ({ darkMode, toggleDarkMode }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showOrderbookLinks, setShowOrderbookLinks] = useState<boolean>(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
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

  // Filter orders based on search query
  const filteredOrdersData = orders.filter(order =>
    order.order_details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentOrders = filteredOrdersData.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(filteredOrdersData.length / recordsPerPage);

  // New state variables for orderbook pagination
  const [currentOrderbookPage, setCurrentOrderbookPage] = useState<number>(1);
  const orderbooksPerPage = 5; // Adjust as needed

  const indexOfLastOrderbook = currentOrderbookPage * orderbooksPerPage;
  const indexOfFirstOrderbook = indexOfLastOrderbook - orderbooksPerPage;
  const currentOrderbooks = filteredOrdersData.slice(
    indexOfFirstOrderbook,
    indexOfLastOrderbook
  );

  const totalOrderbookPages = Math.ceil(filteredOrdersData.length / orderbooksPerPage);

  // State variables for orders pagination
  const [currentOrdersPage, setCurrentOrdersPage] = useState<number>(1);
  const ordersPerPage = 10;

  const indexOfLastOrder = currentOrdersPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrdersPageData = filteredOrdersData.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const totalOrdersPages = Math.ceil(filteredOrdersData.length / ordersPerPage);

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
        await checkAndCreateChatrooms(response.data.orders || response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const checkAndCreateChatrooms = async (orders) => {
    const updatedOrders = [];
    for (const order of orders) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-and-create-chatroom`,
          { orderId: order.order_id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );
        updatedOrders.push({ ...order, ...response.data });
      } catch (error) {
        console.error(
          `Error checking chatroom for order ${order.order_id}:`,
          error
        );
        updatedOrders.push(order);
      }
    }
    setOrders(updatedOrders);
  };

  const handleOpenChat = async (orderId) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-and-create-chatroom`,
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setChatUrls(response.data);
    } catch (error) {
      console.error('Error opening chat:', error);
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
        setFilteredOrders((prevOrders) => {
          if (
            prevOrders.some(
              (order) => order.order_id === parsedContent.order_id
            )
          ) {
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
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [holdInvoice, setHoldInvoice] = useState<string | null>(null);

  const handleOrderCreated = async (order: Order, holdInvoice: string) => {
    console.log('Order created:', order);
    console.log('Hold invoice:', holdInvoice);
    setOrderDetails(order);
    setHoldInvoice(holdInvoice);
    setCurrentStep(2); // Move to the "Hold Invoice" step
    setIsModalOpen(true); // Keep the modal open to show the invoice
  };

  const handleCreateOrderClick = () => {
    setIsModalOpen(true);
    setShowOrders(false); // Hide orders table when creating a new order
    setShowProfileSettings(false); // Hide profile settings
  };

  const handleMyOrdersClick = () => {
    setShowOrders(true);
    setIsModalOpen(false); // Hide create order form when viewing orders
    setShowProfileSettings(false); // Hide profile settings
    setIsTakeOrderModalOpen(false);
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

  const steps = ['Create Order', 'Hold Invoice', 'Submit Payout', 'Full Invoice', 'Order Completed 🚀'];

  const handleNextStep = () => {
    if (currentStep < steps.length) {
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
    const steps = order.type === 0 
      ? ['Hold Invoice', 'Full Invoice'] // Buy order steps
      : ['Hold Invoice', 'Submit Payout']; // Sell order steps

    setTakeOrderSteps(steps);
    setCurrentTakeOrderStep(1);
    setSelectedOrder(order); // Set the selected order
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

  return (
    <div className={`flex ${darkMode ? 'dark' : ''}`}>
      {isDrawerOpen && (
        <div className='fixed flex h-screen w-60 flex-col justify-between bg-gray-800 p-4 text-white'>
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
                <a href='#' className='flex items-center justify-center gap-2'>
                  <span className='flex w-6 justify-center'>
                    <RxDashboard className='text-xl text-gray-400' />
                  </span>
                  <span className={`${darkMode ? 'text-white' : 'text-black'}`}>
                    Dashboard
                  </span>
                </a>
                <a href='#' className='flex items-center justify-center gap-2' onClick={handleMyOrdersClick}>
                  <span className='flex w-6 justify-center'>
                    <BsJournalBookmarkFill className='text-xl text-gray-400' />
                  </span>
                  <span className={`${darkMode ? 'text-white' : 'text-black'}`}>
                    My Orders
                  </span>
                </a>
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
        className='fixed relative h-screen flex-1 bg-gray-100 p-8 dark:bg-gray-900'
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
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <span
                      className={`cursor-pointer ${currentStep === index + 1 ? 'font-bold text-orange-500' : 'text-gray-500'}`}
                      onClick={() => setCurrentStep(index + 1)}
                    >
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <FaChevronRight className='mx-2 text-gray-500' />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className='flex flex-col h-100 rounded-lg justify-center items-center gap-2'>
                {currentStep === 1 && <CreateOrderForm onOrderCreated={handleOrderCreated} />}
                {currentStep === 2 && orderDetails && holdInvoice && (
                  <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg ml-12 mt-4'>
                    <h2 className='mb-6 text-center text-2xl font-bold text-orange-500'>Hold Invoice</h2>
                    <p className='mb-4 break-words'>
                      <span className='font-bold text-gray-700'>Invoice:</span> {holdInvoice}
                    </p>
                    <div className='mb-4 flex justify-center'>
                      <QRCode value={holdInvoice} size={200} />
                    </div>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Order ID:</span> {orderDetails.order_id}
                    </p>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Amount:</span> {orderDetails.amount_msat / 1000} sats
                    </p>
                    <p className='mb-4'>
                      <span className='font-bold text-gray-700'>Status:</span> {orderDetails.status}
                    </p>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className='focus:shadow-outline w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                    >
                      Next Step
                    </button>
                  </div>
                )}
                {currentStep === 3 && <SubmitPayout />}
                {currentStep === 4 && <FullInvoice />}
                {currentStep === 5 && (
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
                {currentTakeOrderStep === 1 && <TakeOrder orderId={selectedOrder.order_id} />}
                {currentTakeOrderStep === 2 && (
                  selectedOrder.type === 0 ? <TakerFullInvoice orderId={selectedOrder.order_id} /> : <SubmitPayout orderId={selectedOrder.order_id} />
                )}
              </div>
            </div>
          </div>
        )}

        {!isTakeOrderModalOpen && showOrders && (
          <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
            <h3 className='mb-4 ml-12 text-lg font-semibold text-gray-700 dark:text-gray-200'>
              Orders
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
                            <button
                              onClick={() =>
                                toggleRowExpansion(order.order_id)
                              }
                            >
                              {expandedRow === order.order_id ? (
                                <BsChevronUp className='text-xl' />
                              ) : (
                                <BsChevronDown className='text-xl' />
                              )}
                            </button>
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
                                <button
                                  className='focus:shadow-outline mt-2 rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                                  onClick={() =>
                                    handleTakeOrder(order)
                                  }
                                >
                                  Take Order
                                </button>
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

        {showProfileSettings && (
          <div className='rounded-lg bg-white p-8 shadow dark:bg-gray-800'>
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