
'use client';

import { useMemo, useState }from 'react';
import { useOrders, type ExpandedOrder } from '@/lib/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACTUAL_REVENUE_DATA, ActualRevenue } from '@/lib/actual-revenue-data';
import { format } from 'date-fns';

// Helper function to format timestamp to HH:MM string for matching
const formatToHHMM = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'yyyy-MM-dd');
};

export default function ActualRevenueDisplay() {
  const { orders, isLoading, error } = useOrders();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

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

  const { ordersByDate, availableDates } = useMemo(() => {
    const ordersByDate: Record<string, ExpandedOrder[]> = {};
    if (orders) {
        orders.forEach(order => {
            const date = formatDate(order.createdAt);
            if (!ordersByDate[date]) {
                ordersByDate[date] = [];
            }
            ordersByDate[date].push(order);
        });
    }
    const availableDates = Object.keys(ordersByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if(availableDates.length > 0 && !selectedDate) {
        setSelectedDate(availableDates[0]);
    }
    return { ordersByDate, availableDates };
  }, [orders, selectedDate]);


  const matchedOrders = useMemo(() => {
    if (!selectedDate || !ordersByDate[selectedDate]) return [];

    const dailyOrders = ordersByDate[selectedDate];
    const matched: (ExpandedOrder & { actual?: ActualRevenue })[] = [];
    
    // Deep copy the map for manipulation within this memo
    const tempActualRevenueMap = new Map(actualRevenueMap.entries());

    dailyOrders.forEach(order => {
      const orderTimeKey = formatToHHMM(new Date(order.createdAt));
      const potentialMatches = tempActualRevenueMap.get(orderTimeKey);

      if (potentialMatches && potentialMatches.length > 0) {
        let foundMatch = false;
        for (let i = 0; i < potentialMatches.length; i++) {
            const match = potentialMatches[i];
            const actualDate = match.dateTime.substring(0, 10);
            const orderDate = format(new Date(order.createdAt), 'yyyy-MM-dd');

            // Additional check if date part matches 'YYYY-MM-DD'
            if(orderDate === actualDate.split('-').reverse().join('-')) {
                 matched.push({ ...order, actual: match });
                 potentialMatches.splice(i, 1); // Remove the matched item
                 foundMatch = true;
                 break; 
            }
        }
        if (!foundMatch) {
             matched.push({ ...order, actual: undefined });
        }
      } else {
        matched.push({ ...order, actual: undefined });
      }
    });

    return matched.sort((a, b) => b.createdAt - a.createdAt);
  }, [selectedDate, ordersByDate, actualRevenueMap]);

  if (isLoading) {
    return <div>Loading revenue data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading data: {error.message}</div>;
  }

  return (
    <Tabs value={selectedDate} onValueChange={setSelectedDate} className="w-full">
        <TabsList>
            {availableDates.map(date => (
                <TabsTrigger key={date} value={date}>{format(new Date(date), 'PPP')}</TabsTrigger>
            ))}
        </TabsList>
        {availableDates.map(date => (
            <TabsContent key={date} value={date}>
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Details for {format(new Date(date), 'PPP')}</CardTitle>
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
                            {matchedOrders.length > 0 ? matchedOrders.map(order => {
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
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No orders to display for this date.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
    </Tabs>
  );
}
