
'use client';

import { useMemo } from 'react';
import { useOrders, type ExpandedOrder } from '@/lib/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ACTUAL_REVENUE_DATA, ActualRevenue } from '@/lib/actual-revenue-data';

// Helper function to format timestamp to HH:MM string for matching
const formatToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ActualRevenueDisplay() {
  const { orders, isLoading, error } = useOrders();

  const actualRevenueMap = useMemo(() => {
    const map = new Map<string, ActualRevenue[]>();
    ACTUAL_REVENUE_DATA.forEach(item => {
        const timeKey = item.dateTime.substring(11, 16); // "HH:MM"
        if (!map.has(timeKey)) {
            map.set(timeKey, []);
        }
        map.get(timeKey)!.push(item);
    });
    return map;
  }, []);

  const matchedOrders = useMemo(() => {
    if (!orders) return [];

    const matched: (ExpandedOrder & { actual?: ActualRevenue })[] = [];

    orders.forEach(order => {
      const orderTimeKey = formatToHHMM(new Date(order.createdAt));
      const potentialMatches = actualRevenueMap.get(orderTimeKey);

      if (potentialMatches && potentialMatches.length > 0) {
        // Find the first available match and "consume" it by removing it
        let foundMatch = false;
        for (let i = 0; i < potentialMatches.length; i++) {
            // A more sophisticated matching could be done here if needed
            // For now, we take the first match.
            const match = potentialMatches[i];
            matched.push({ ...order, actual: match });
            potentialMatches.splice(i, 1); // Remove the matched item
            foundMatch = true;
            break; 
        }
        if (!foundMatch) {
             matched.push({ ...order, actual: undefined });
        }
      } else {
        matched.push({ ...order, actual: undefined });
      }
    });

    return matched.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, actualRevenueMap]);

  if (isLoading) {
    return <div>Loading revenue data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading data: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Summary Time</TableHead>
              <TableHead>Actual Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Summary Amount</TableHead>
              <TableHead>Actual Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchedOrders.map(order => {
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                    <TableRow key={order.id}>
                        <TableCell>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</TableCell>
                        <TableCell>{order.actual ? new Date(order.actual.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'N/A'}</TableCell>
                        <TableCell>
                            <ul className="list-disc list-inside">
                                {order.items.map(item => (
                                    <li key={item.drinkId}>{item.name}</li>
                                ))}
                            </ul>
                        </TableCell>
                        <TableCell>{totalQty}</TableCell>
                        <TableCell>{order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{order.actual ? order.actual.amount.toFixed(2) : 'N/A'}</TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
