import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaBell, FaMoon, FaSun, FaCog, FaFileInvoice, FaFilter, FaPlus, FaQuestionCircle } from 'react-icons/fa';
import { BsJournalBookmarkFill, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { MdOutlinePayments } from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { LuPanelLeftOpen } from 'react-icons/lu'; // Import the icon
import axios from 'axios';
import { useNostr } from '../pages/useNostr'; // Adjust the path as necessary
import { useRouter } from 'next/router';

const Dashboard: React.FC<{ darkMode: boolean; toggleDarkMode: () => void }> = ({
  darkMode,
  toggleDarkMode,
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showOrderbookLinks, setShowOrderbookLinks] = useState<boolean>(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const { signAndSendEvent, subscribeToEvents } = useNostr();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 10;
  const maxPageButtons = 5; // Maximum number of page buttons to display at a time
  const [selectedOrderbook, setSelectedOrderbook] = useState<string | null>(null);
  const router = useRouter();
  const [chatUrls, setChatUrls] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentOrders = orders.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(orders.length / recordsPerPage);

  // New state variables for orderbook pagination
  const [currentOrderbookPage, setCurrentOrderbookPage] = useState<number>(1);
  const orderbooksPerPage = 5; // Adjust as needed

  // Calculate indices for orderbooks pagination
  const indexOfLastOrderbook = currentOrderbookPage * orderbooksPerPage;
  const indexOfFirstOrderbook = indexOfLastOrderbook - orderbooksPerPage;
  const currentOrderbooks = orders.slice(indexOfFirstOrderbook, indexOfLastOrderbook);

  const totalOrderbookPages = Math.ceil(orders.length / orderbooksPerPage);

  const handleOrderbookPageClick = (pageNumber: number) => {
    setCurrentOrderbookPage(pageNumber);
  };

  const getOrderbookPageNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(1, currentOrderbookPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalOrderbookPages, startPage + maxPageButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
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
        console.error(`Error checking chatroom for order ${order.order_id}:`, error);
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

  return (
    <div className={`flex ${darkMode ? 'dark' : ''}`}>
      {isDrawerOpen && (
        <div className="w-60 bg-gray-800 text-white h-screen p-4 flex flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center justify-center gap-2 mt-6 relative">
              <Image src="/hachiko-logo.svg" alt="CivKit Logo" width={40} height={40} />
              <h1 className="text-2xl font-bold">CivKit</h1>
              <button
                onClick={toggleDrawer}
                className="relative left-11 p-1 bg-gray-500 z-10" // Removed 'rounded-full'
              >
                <LuPanelLeftOpen className={`transform transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <nav>
              <hr className="my-8" />
              <div className="flex flex-col justify-center items-center gap-8">
                <a href="#" className="flex items-center justify-center gap-2">
                  <span className="w-6 flex justify-center">
                    <RxDashboard className="text-xl text-gray-400" />
                  </span>
                  Dashboard
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 ml-8"
                  onClick={() => setShowOrderbookLinks(!showOrderbookLinks)}
                >
                  <span className="w-6 flex justify-center">
                    <BsJournalBookmarkFill className="text-xl text-gray-400" />
                  </span>
                  Orderbook
                  <span className="w-6 flex justify-center">
                    {showOrderbookLinks ? (
                      <BsChevronUp className="text-xl text-gray-400" />
                    ) : (
                      <BsChevronDown className="text-xl text-gray-400" />
                    )}
                  </span>
                </a>
                {showOrderbookLinks && (
                  <>
                    <a
                      href="/orders"
                      className="flex items-center justify-center gap-2"
                      onClick={() => setSelectedOrderbook('local')}
                    >
                      <span className="w-6 flex justify-center">
                        <BsJournalBookmarkFill className="text-xl text-gray-400" />
                      </span>
                      Local Orderbook
                    </a>
                    <a
                      href="/filteredOrders"
                      className="flex items-center justify-center gap-2"
                      onClick={() => setSelectedOrderbook('global')}
                    >
                      <span className="w-6 flex justify-center">
                        <BsJournalBookmarkFill className="text-xl text-gray-400" />
                      </span>
                      Global Orderbook
                    </a>
                  </>
                )}
                <a href="#" className="flex items-center justify-center gap-8">
                  <span className="w-6 flex justify-center">
                    <FaFileInvoice className="text-xl text-gray-400" />
                  </span>
                  Invoices
                </a>
                <a href="#" className="flex items-center justify-center gap-8">
                  <span className="w-6 flex justify-center">
                    <MdOutlinePayments className="text-xl text-gray-400" />
                  </span>
                  Payouts
                </a>
              </div>
              <ul className="mt-8 flex flex-col items-center justify-center gap-4">
                <li className="mb-4 flex items-center justify-center gap-8">
                  <span className="w-6 flex justify-center">
                    <FaCog className="text-xl text-gray-400" />
                  </span>
                  <a href="#">
                    Settings
                  </a>
                </li>
                <li className="mb-4 flex items-center justify-center gap-8">
                  <span className="w-6 flex justify-center">
                    <CgProfile className="text-xl text-gray-400" />
                  </span>
                  <a href="#">Profile</a>
                </li>
              </ul>
            </nav>
          </div>
          <button onClick={handleLogout} className="mt-4 p-2 bg-red-500 text-white rounded">
            Logout
          </button>
        </div>
      )}

      <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900 relative">
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Find Order..."
            className="p-2 border border-gray-300 w-1/2 rounded-3xl"
          />
          <div className="flex items-center space-x-4">
            <FaQuestionCircle className="text-gray-600 dark:text-gray-300 cursor-pointer" />
            <FaBell className="text-gray-600 dark:text-gray-300 cursor-pointer" />
            <button onClick={toggleDarkMode}>
              {darkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-600" />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Welcome 👋</h2>
          <div className="flex space-x-6">
            <button className="p-2 w-36 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl flex items-center justify-center gap-2">
              <FaFilter />
              Filter
            </button>
            <button className="p-2 w-36 bg-orange-500 hover:bg-orange-600 text-white rounded-3xl flex items-center justify-center gap-2">
              <FaPlus />
              Create Order
            </button>
          </div>
        </div>
        
        <hr className="mb-6" />

        {selectedOrderbook === 'local' && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4 text-white">Local Orderbook</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {currentOrderbooks.length > 0 ? (
                currentOrderbooks.map((order) => (
                  <div key={order.order_id} className="rounded-lg bg-white p-6 shadow-lg">
                    {/* Render orderbook details */}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-700">No orders found.</p>
              )}
            </div>
            <div className="flex justify-center mt-4">
              {getOrderbookPageNumbers().map((number) => (
                <button
                  key={number}
                  onClick={() => handleOrderbookPageClick(number)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentOrderbookPage === number ? 'bg-blue-500 text-white' : 'bg-gray-300'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedOrderbook === 'global' && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4 text-white">Global Orderbook</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {currentOrderbooks.length > 0 ? (
                currentOrderbooks.map((order) => (
                  <div key={order.order_id} className="rounded-lg bg-white p-6 shadow-lg">
                    {/* Render orderbook details */}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-700">No orders found.</p>
              )}
            </div>
            <div className="flex justify-center mt-4">
              {getOrderbookPageNumbers().map((number) => (
                <button
                  key={number}
                  onClick={() => handleOrderbookPageClick(number)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentOrderbookPage === number ? 'bg-blue-500 text-white' : 'bg-gray-300'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedOrderbook === null && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Orders</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.order_id} className="rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="mb-2 text-lg font-bold text-gray-700">Order #{order.order_id}</h3>
                    <p className="text-gray-700"><strong>Details:</strong> {order.order_details}</p>
                    <p className="text-gray-700"><strong>Amount:</strong> {order.amount_msat} msat</p>
                    <p className="text-gray-700"><strong>Currency:</strong> {order.currency}</p>
                    <p className="text-gray-700"><strong>Payment Method:</strong> {order.payment_method}</p>
                    <p className="text-gray-700"><strong>Status:</strong> {order.status}</p>
                    <p className="text-gray-700"><strong>Order Type:</strong> {order.type === 0 ? 'Buy' : 'Sell'}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        className="focus:shadow-outline rounded-3xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 focus:outline-none"
                        onClick={() => handleTakeOrder(order.order_id)}
                      >
                        Take Order
                      </button>
                      {order.status === 'chat_open' && (
                        <button
                          className="focus:shadow-outline rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-600 focus:outline-none"
                          onClick={() => handleOpenChat(order.order_id)}
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-700">No orders found.</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">Filtered Orders</h3>
          {isSigned ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div key={order.order_id} className="rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="mb-2 text-lg font-bold text-gray-700">Order ID: {order.order_id}</h3>
                    <p className="text-gray-700">Status: {order.status}</p>
                    <p className="text-gray-700">Amount (msat): {order.amount_msat}</p>
                    <p className="text-gray-700">Currency: {order.currency}</p>
                    <p className="text-gray-700">Payment Method: {order.payment_method}</p>
                    <p className="text-gray-700">Type: {order.type === 0 ? 'Buy' : 'Sell'}</p>
                    <p className="text-gray-700">
                      <a
                        href={`${order.frontend_url}/take-order?orderId=${order.order_id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-500 hover:text-blue-700'
                      >
                        Take Order
                      </a>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-700">No filtered orders found.</p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-700">Signing event, please wait...</p>
          )}
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;