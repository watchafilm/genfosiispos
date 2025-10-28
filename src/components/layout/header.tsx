
'use client';

import Link from 'next/link';
import { ShoppingCart, Package, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between pl-4">
        <Link href="/" className="flex items-center space-x-2">
          <ShoppingCart className="h-10 w-10 text-primary" />
          <h1 className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text font-headline text-2xl md:text-3xl font-bold text-transparent">
            Genfosis POS
          </h1>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/')}>
            POS
          </Button>
          <Button variant="ghost" onClick={() => router.push('/summary')}>
            Summary
          </Button>
          <Button variant="ghost" onClick={() => router.push('/stock')}>
             <Package className="mr-2 h-4 w-4" /> Stock
          </Button>
          <Button variant="ghost" onClick={() => router.push('/actualrevenue')}>
             <BarChart className="mr-2 h-4 w-4" /> Actual Revenue
          </Button>
        </nav>
      </div>
    </header>
  );
}
