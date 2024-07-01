import Link from 'next/link';

const NavBar = () => {
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" legacyBehavior>
          <a className="text-2xl font-bold text-blue-600 hover:bg-orange-500 hover:text-white py-1 px-2 rounded">CivKit</a>
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link href="/create-order" legacyBehavior>
              <a className="text-gray-800 hover:text-orange-500">Create Order</a>
            </Link>
          </li>
          <li>
            <Link href="/orders" legacyBehavior>
              <a className="text-gray-800 hover:text-orange-500">View Orders</a>
            </Link>
          </li>
          <li>
            <Link href="/login" legacyBehavior>
              <a className="text-gray-800 hover:text-orange-500">Login</a>
            </Link>
          </li>
          <li>
            <Link href="/register" legacyBehavior>
              <a className="text-gray-800 hover:text-orange-500">Register</a>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
