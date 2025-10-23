
'use client';

import { useState, useEffect } from 'react';
import { DRINKS } from '@/lib/data';
import type { Drink } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function StockManager() {
  const [products, setProducts] = useState<Drink[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, you'd fetch this from a database.
    // For now, we use the static data and local storage to persist changes.
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      setProducts(DRINKS);
    }
  }, []);

  const handleInputChange = (productId: string, field: keyof Drink, value: string | number) => {
    setProducts(currentProducts =>
      currentProducts.map(p => {
        if (p.id === productId) {
          const parsedValue = (field === 'price' || field === 'stock' || field === 'sold') ? Number(value) : value;
          return { ...p, [field]: parsedValue };
        }
        return p;
      })
    );
  };

  const handleSaveChanges = () => {
    // In a real app, this would be an API call to update the database.
    localStorage.setItem('products', JSON.stringify(products));
    toast({
      title: 'Stock Updated',
      description: 'Product information has been saved successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead className="w-[150px]">Price (THB)</TableHead>
            <TableHead className="w-[120px]">Stock</TableHead>
            <TableHead className="w-[120px]">Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => (
            <TableRow key={product.id}>
              <TableCell>
                <Input
                  value={product.name}
                  onChange={(e) => handleInputChange(product.id, 'name', e.target.value)}
                  className="w-full"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) => handleInputChange(product.id, 'price', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={product.stock}
                  onChange={(e) => handleInputChange(product.id, 'stock', e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={product.sold}
                  onChange={(e) => handleInputChange(product.id, 'sold', e.target.value)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
