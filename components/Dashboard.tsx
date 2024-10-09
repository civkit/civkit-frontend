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

  const truncateNpub = (npub: string | null, length: number = 6) => {
    if (!npub) return 'Profile';
    return npub.length > length ? `${npub.substring(0, length)}...` : npub;
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentOrders = orders.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(orders.length / recordsPerPage);

  // New state variables for orderbook pagination
  const [currentOrderbookPage, setCurrentOrderbookPage] = useState<number>(1);
  const orderbooksPerPage = 5; // Adjust as needed

  const indexOfLastOrderbook = currentOrderbookPage * orderbooksPerPage;
  const indexOfFirstOrderbook = indexOfLastOrderbook - orderbooksPerPage;
  const currentOrderbooks = orders.slice(
    indexOfFirstOrderbook,
    indexOfLastOrderbook
  );

  const totalOrderbookPages = Math.ceil(orders.length / orderbooksPerPage);

  // State variables for orders pagination
  const [currentOrdersPage, setCurrentOrdersPage] = useState<number>(1);
  const ordersPerPage = 10;

  const indexOfLastOrder = currentOrdersPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrdersPageData = orders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const totalOrdersPages = Math.ceil(orders.length / ordersPerPage);

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

  const handleTakeOrder = async (orderId) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/take`,
        {
          orderId,
          takerDetails: { description: 'Detailed description for the taker' },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      console.log('Order taken successfully:', response.data);
    } catch (error) {
      console.error('Error taking order:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      alert('Redirecting...');
    }

    window.location.href = `/take-order?orderId=${orderId}`;
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

  const handleOrderCreated = (order: any) => {
    console.log('Order created:', order);
    setIsModalOpen(false);
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
                <a href='#' className='flex items-center justify-center gap-2'>
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
                    onClick={() => setShowProfileSettings(!showProfileSettings)}
                  >
                    {truncateNpub(npub)}
                  </a>
                  <FaChevronRight
                    className='cursor-pointer text-white'
                    onClick={() => setShowProfileSettings(!showProfileSettings)}
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
        className='fixed relative h-screen flex-1 bg-gray-100 p-6 dark:bg-gray-900'
        style={{ marginLeft: isDrawerOpen ? '15rem' : '0' }}
      >
        <div className='mb-6 mt-4 flex items-center justify-between'>
          <input
            type='text'
            placeholder='Find Order...'
            className='ml-12 w-1/2 rounded-lg border border-gray-300 p-2'
          />
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
              onClick={() => setIsModalOpen(true)}
              className='flex w-36 items-center justify-center gap-2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600'
            >
              <FaPlus />
              Create Order
            </button>
          </div>
        </div>

        <hr className='mb-6' />

        {showProfileSettings ? (
          <div className='w-3/4 rounded bg-white p-4 shadow dark:bg-gray-800'>
            <h3
              className={`mb-4 text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
            >
              Profile Settings
            </h3>
            <form className='space-y-4'>
              <div>
                <label
                  className={`mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Public Key
                </label>
                <input
                  type='text'
                  value={npub || ''}
                  readOnly
                  className='w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white'
                />
              </div>
              <div>
                <label
                  className={`mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Relay URL
                </label>
                <div className='flex flex-row items-center justify-center gap-2'>
                  <input
                    type='text'
                    value={relayUrl}
                    onChange={(e) => setRelayUrl(e.target.value)}
                    className='w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white'
                  />
                  <button className='w-24 rounded-lg bg-orange-500 p-2 text-white'>
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            {selectedOrderbook === null && (
              <div className='rounded-lg bg-white p-4 shadow dark:bg-gray-800'>
                <h3 className='mb-4 ml-12 text-lg font-semibold text-white'>
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
                        <tr className='text-white'>
                          <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            Order ID
                          </th>
                          <th className='border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700'>
                            Details
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
                      <tbody className='text-white'>
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
                                        handleTakeOrder(order.order_id)
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
                  <span className='mx-2 text-white'>
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

            {showOrderbookLinks && (
              <div className='mb-6 rounded bg-white p-4 shadow dark:bg-gray-800'>
                <h3 className='mb-4 text-lg font-semibold text-white'>
                  Orders
                </h3>
                {orders.length > 0 ? (
                  <table className='min-w-full bg-white dark:bg-gray-800'>
                    <thead>
                      <tr>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Order ID
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Details
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Amount (msat)
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Currency
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Payment Method
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Status
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Order Type
                        </th>
                        <th className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.order_id}>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.order_id}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.order_details}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {(order.amount_msat / 1000).toFixed(3)} sats
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.currency}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.payment_method}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.status}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            {order.type === 0 ? 'Buy' : 'Sell'}
                          </td>
                          <td className='border-b border-gray-200 px-4 py-2 dark:border-gray-700'>
                            <button
                              className='focus:shadow-outline rounded-3xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none'
                              onClick={() => handleTakeOrder(order.order_id)}
                            >
                              Take Order
                            </button>
                            {order.status === 'chat_open' && (
                              <button
                                className='focus:shadow-outline rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-600 focus:outline-none'
                                onClick={() => handleOpenChat(order.order_id)}
                              >
                                Open Chat
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className='text-center text-gray-700'>No orders found.</p>
                )}
              </div>
            )}
          </>
        )}

        {chatUrls && (
          <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
            <div className='rounded-lg bg-white p-8 shadow-lg'>
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

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <CreateOrderForm onOrderCreated={handleOrderCreated} />
        </Modal>
      </div>
    </div>
  );
};

export default Dashboard;
