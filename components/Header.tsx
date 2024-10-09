// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/create-order'>Create Order</Link>
          </li>
          <li>
            <Link href='/orders'>View Orders</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
