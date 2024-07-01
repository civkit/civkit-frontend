import { useRouter } from 'next/router';
import CreateOrderForm from '../components/CreateOrderForm';

export default function CreateOrderPage() {
  const router = useRouter();

  const handleOrderCreated = (order) => {
    router.push(`/orders/${order.order_id}`);
  };

  return (
    <div>
      <CreateOrderForm onOrderCreated={handleOrderCreated} />
    </div>
  );
}
