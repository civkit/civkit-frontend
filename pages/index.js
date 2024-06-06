import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to CivKit</h1>
      <nav>
        <ul>
          <li><Link href="/create-order">Create Order</Link></li>
          <li><Link href="/orders">View Orders</Link></li>
        </ul>
      </nav>
    </div>
  );
}
