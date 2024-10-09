import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center rounded-lg bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] max-w-[80vw] overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-black bg-red-500 border border-gray-300 rounded-lg p-2 z-10"
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
