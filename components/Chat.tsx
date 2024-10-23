import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatProps {
  orderId: string;
}

const Chat: React.FC<ChatProps> = ({ orderId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
    // Set up a timer to periodically fetch new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/${orderId}`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <p>{msg.content}</p>
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
