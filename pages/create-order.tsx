import { useRouter } from 'next/router';
import CreateOrderForm from '../components/CreateOrderForm';

export default function CreateOrderPage() {
  const router = useRouter();

  const handleOrderCreated = (order: any) => {
    console.log('Order created, redirecting to:', `/orders/${order.order_id}`);
    router.push(`/orders/${order.order_id}`);
  };

  return (
    <div>
      <CreateOrderForm onOrderCreated={handleOrderCreated} />
    </div>
  );
}
