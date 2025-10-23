'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AppHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center">
        <Link href="/" className="flex items-center space-x-2">
          <ShoppingCart className="h-10 w-10 text-primary" />
          <h1 className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text font-headline text-2xl md:text-3xl font-bold text-transparent">
            Genfosis POS
          </h1>
        </Link>
      </div>
    </header>
  );
}
