
import StockManager from '@/components/stock/stock-manager';

export default function StockPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold font-headline mb-6">Stock Management</h1>
      <StockManager />
    </div>
  );
}
