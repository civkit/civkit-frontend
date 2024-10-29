// contexts/OrderContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface OrderContextType {
  orderId: number | null;
  setOrderId: (id: number | null) => void;
  orderStatus: string;
  setOrderStatus: (status: string) => void;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');

  return (
    <OrderContext.Provider value={{ orderId, setOrderId, orderStatus, setOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};