
import ActualRevenueDisplay from '@/components/revenue/actual-revenue-display';

export default function ActualRevenuePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold font-headline mb-6">Actual Revenue</h1>
      <ActualRevenueDisplay />
    </div>
  );
}
