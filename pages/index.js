import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      {/* NavBar is already included in _app.js, so we don't need it here */}

      <div className="text-center py-16 bg-blue-600 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to CivKit</h1>
        <p className="text-xl mb-6">Your one-stop shop for everything!</p>
        <Link href="/create-order" legacyBehavior>
          <a className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded text-lg">Shop Now</a>
        </Link>
        <div className="mt-6">
          <Image src="/hachiko-logo.svg" alt="Hachiko Logo" width={100} height={100} className="mx-auto" />
        </div>
      </div>

      <div className="container mx-auto py-16">
        <h2 className="text-center text-3xl font-bold mb-8">Our Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <h5 className="text-lg font-bold mb-2">Nostr Based Identity </h5>
            <p>Be reliable and honest, without KYC</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h5 className="text-lg font-bold mb-2">Moderated Escrow</h5>
            <p>Ensure your sats are safe with our closely managed escrow service</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h5 className="text-lg font-bold mb-2">Customer Support</h5>
            <p>24/7 customer support to assist you.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow">
              <p className="italic">"Amazing service and great products!"</p>
              <p className="mt-2 font-bold">- John Doe</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <p className="italic">"I love shopping here. Highly recommend!"</p>
              <p className="mt-2 font-bold">- Jane Smith</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 text-white text-center py-4">
        <p>© 2024 CivKit. Open Source Forever</p>
      </footer>
    </div>
  );
}
