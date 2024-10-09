import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50'>
      <div className='relative max-h-[80vh] max-w-[80vw] overflow-y-auto rounded-lg bg-white p-6 shadow-lg'>
        <button
          className='absolute right-2 top-2 z-10 rounded-lg border border-gray-300 bg-red-500 p-2 text-black'
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
