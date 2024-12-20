import React from 'react';
import { IoInformationCircle } from 'react-icons/io5';

interface TooltipProps {
  message: string | React.ReactNode;
}

const Tooltip = ({ message }: TooltipProps) => {
  return (
    <div className='group relative flex flex-col items-center'>
      <span className='absolute bottom-full z-10 mb-2 hidden w-48 rounded bg-gray-800 p-2 text-sm text-white opacity-0 shadow-lg transition-opacity duration-300 ease-in-out group-hover:block group-hover:opacity-100'>
        {message}
      </span>
      <span className='cursor-pointer'>
        <IoInformationCircle
          size={16}
          className='text-gray-500 transition-colors duration-200 hover:text-gray-700'
        />
      </span>
    </div>
  );
};

export default Tooltip;
