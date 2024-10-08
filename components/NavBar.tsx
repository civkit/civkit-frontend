import Link from 'next/link';

const NavBar = () => {
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600 hover:bg-orange-500 hover:text-white py-1 px-2 rounded">
          CivKit
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link href="/create-order" className="text-gray-800 hover:text-orange-500">Create Order</Link>
          </li>
          <li>
            <Link href="/orders" className="text-gray-800 hover:text-orange-500">View Orders</Link>
          </li>
          <li>
            <Link href="/login" className="text-gray-800 hover:text-orange-500">Login</Link>
          </li>
          <li>
            <Link href="/register" className="text-gray-800 hover:text-orange-500">Register</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
