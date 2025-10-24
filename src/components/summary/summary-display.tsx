
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useOrders, type ExpandedOrder } from '@/lib/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Summary, ProductSummary, Drink } from '@/lib/types';
import { DRINKS } from '@/lib/data';

function calculateSummary(orders: ExpandedOrder[], products: Drink[]): { summary: Summary, productSummaries: ProductSummary[] } {
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const totalOrders = orders.length;

    const itemStats = new Map<string, { quantity: number; revenue: number }>();

    orders.flatMap(o => o.items).forEach(item => {
        const stats = itemStats.get(item.name) || { quantity: 0, revenue: 0 };
        stats.quantity += item.quantity;
        stats.revenue += item.quantity * item.price;
        itemStats.set(item.name, stats);
    });
    
    const mostPopularProduct = [...itemStats.entries()].sort((a, b) => b[1].quantity - a[1].quantity)[0]?.[0] || 'N/A';

    const productSummaries = products.map(product => {
        const stats = itemStats.get(product.name) || { quantity: 0, revenue: 0 };
        return {
            name: product.name,
            sold: stats.quantity,
            stock: product.stock,
            revenue: stats.revenue,
        };
    });

    return {
        summary: {
            totalRevenue,
            totalOrders,
            mostPopularProduct,
        },
        productSummaries
    };
}


export default function SummaryDisplay() {
  const { orders, isLoading, error } = useOrders();
  const [products, setProducts] = useState<Drink[]>(DRINKS);
  
  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    }
  }, [orders]); // Re-check local storage when orders change, as it might signify an update

  const { summary, productSummaries } = useMemo(() => {
    if (!orders) return { 
        summary: { totalRevenue: 0, totalOrders: 0, mostPopularProduct: 'N/A' },
        productSummaries: products.map(p => ({ name: p.name, sold: 0, stock: p.stock, revenue: 0}))
    };
    return calculateSummary(orders, products);
  }, [orders, products]);

  if (isLoading) {
    return <div>Loading summary...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading summary: {error.message}</div>;
  }
  
  const getOrderStatus = (order: ExpandedOrder): { status: 'pending' | 'in progress' | 'served', servedCount: number, totalCount: number } => {
    const totalCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

    if (!order.itemStatuses) {
        return { status: 'pending', servedCount: 0, totalCount };
    }
    
    const servedCount = order.itemStatuses.filter(s => s === 'served').length;

    if (servedCount === totalCount) {
        return { status: 'served', servedCount, totalCount };
    }
    if (servedCount > 0) {
        return { status: 'in progress', servedCount, totalCount };
    }
    return { status: 'pending', servedCount, totalCount };
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalRevenue.toFixed(2)} THB</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalOrders}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Popular Product</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.mostPopularProduct}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Product Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Sold</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productSummaries.map(product => (
                             <TableRow key={product.name}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.sold}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell>{product.revenue.toFixed(2)} THB</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders && orders.length > 0 ? (
                        orders.sort((a, b) => b.createdAt - a.createdAt).map(order => {
                           const { status, servedCount, totalCount } = getOrderStatus(order);
                           return (
                                <TableRow key={order.id}>
                                    <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                                    <TableCell>
                                        <ul className="list-disc list-inside">
                                            {order.items.map((item, index) => (
                                                <li key={index}>{item.quantity}x {item.name}</li>
                                            ))}
                                        </ul>
                                    </TableCell>
                                    <TableCell>{order.totalAmount.toFixed(2)} THB</TableCell>
                                    <TableCell>{order.paymentMethod}</TableCell>
                                    <TableCell>
                                        <Badge variant={status === 'served' ? 'secondary' : (status === 'in progress' ? 'default' : 'outline')}>
                                            {status} ({servedCount}/{totalCount})
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                           );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">No orders found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
