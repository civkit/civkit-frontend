import React from 'react';
import { IoInformationCircle } from "react-icons/io5";

interface TooltipProps {
  message: string | React.ReactNode;
}

const Tooltip = ({ message }: TooltipProps) => {
  return (
    <div className="relative flex flex-col items-center group">
      <span className="absolute bottom-full mb-2 hidden w-48 p-2 text-sm text-white bg-gray-800 rounded shadow-lg group-hover:block z-10 transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100">
        {message}
      </span>
      <span className="cursor-pointer">
        <IoInformationCircle size={16} className="text-gray-500 hover:text-gray-700 transition-colors duration-200" />
      </span>
    </div>
  );
};

export default Tooltip;
