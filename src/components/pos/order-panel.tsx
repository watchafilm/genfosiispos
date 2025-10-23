
'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wallet, QrCode, CreditCard, PlusCircle, MinusCircle, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Drink, OrderItem, PaymentMethod } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirebase } from '@/firebase/provider';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { DRINKS } from '@/lib/data';


const QR_CODE_URLS = {
    qr: 'https://drive.google.com/uc?export=view&id=1kt1wQUj32SqfyPEgClwo5m3s6wikFLIH',
    credit_card_qr: 'https://drive.usercontent.google.com/download?id=1MDtAIcAu8z1PHv9gaGVGEnHsbR6rAfuy',
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'qr', label: 'QR Scan', icon: QrCode },
  { id: 'credit_card_qr', label: 'Credit Card QR', icon: CreditCard },
];

export default function OrderPanel() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { firestore } = useFirebase();

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [orderItems]);

  const handleSetPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'qr' || method === 'credit_card_qr') {
      setQrCodeUrl(QR_CODE_URLS[method]);
      setShowQr(true);
    } else {
      setShowQr(false);
      setQrCodeUrl(null);
    }
  };

  const handleAddItem = (product: Drink) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.name === product.name);
      if (existingItem) {
        return prevItems.map((item) =>
          item.name === product.name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { name: product.name, price: product.price, quantity: 1, drinkId: product.id }];
    });
  };

  const handleRemoveItem = (productName: Drink['name']) => {
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.name === productName);
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((item) =>
          item.name === productName ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevItems.filter((item) => item.name !== productName);
    });
  };
  
  const handleClearItem = (productName: Drink['name']) => {
    setOrderItems(prevItems => prevItems.filter(item => item.name !== productName));
  };


  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to the order before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (!firestore) {
      toast({
        title: "Submission Failed",
        description: "Firestore is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }


    startTransition(() => {
      try {
        const ordersCollection = collection(firestore, 'orders');
        addDocumentNonBlocking(ordersCollection, {
          items: orderItems,
          totalAmount,
          paymentMethod,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
  
        toast({
          title: "Order Submitted",
          description: "The order has been submitted to the kitchen.",
          action: <CheckCircle className="text-green-500" />,
        });
        setOrderItems([]);
        setShowQr(false);
        setPaymentMethod('cash');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create order.';
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive",
          action: <XCircle className="text-white"/>,
        });
      }
    });
  };

  const getBgColorClass = (productId: string) => {
    switch (productId) {
      case 'drink_1': return 'bg-drink-green/10';
      case 'drink_2': return 'bg-drink-red/10';
      case 'drink_3': return 'bg-drink-yellow/10';
      default: return 'bg-gray-100';
    }
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="grid grid-cols-5 grid-rows-3 gap-4">
        {DRINKS.map((product) => (
            <Card key={product.name} className={cn("overflow-hidden group flex flex-col", product.bgColor)}>
                <div className="relative w-full h-32">
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover object-center transform group-hover:scale-110 transition-transform duration-300"
                    />
                </div>
                <div className="flex flex-col p-3 flex-grow">
                    <h3 className={`font-headline text-sm font-semibold ${product.color} flex-grow`}>{product.name}</h3>
                    <p className="text-muted-foreground font-medium text-xs mb-2">{product.price} THB</p>
                    <div className="mt-auto">
                        <Button onClick={() => handleAddItem(product)} className="w-full h-8 text-xs">
                            <PlusCircle className="mr-2 h-3 w-3" /> Add
                        </Button>
                    </div>
                </div>
            </Card>
        ))}
      </div>

      <div className="flex flex-col h-full">
        <Card className="flex flex-col flex-grow">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Current Order</CardTitle>
            <CardDescription className="min-h-[20px]">
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={showQr ? 'qr-text' : 'review-text'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  {showQr ? `Scan to pay ${totalAmount.toFixed(2)} THB` : "Review items before confirming"}
                </motion.span>
              </AnimatePresence>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <Separator />
            <div className="relative flex-grow min-h-[260px] overflow-auto">
              <AnimatePresence mode="wait">
                {showQr && qrCodeUrl ? (
                  <motion.div
                    key="qr-code"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
                  >
                    <div className="relative w-full h-full">
                      <Image 
                        src={qrCodeUrl} 
                        alt="QR Code for payment" 
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="order-items"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    {orderItems.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center py-8">No items in order.</p>
                      </div>
                    ) : (
                      <div className="h-full overflow-y-auto pr-2">
                        {orderItems.map((item) => (
                          <div key={item.name} className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.price} THB</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(item.name)}>
                                  <MinusCircle className="h-4 w-4"/>
                              </Button>
                              <span className="font-bold w-4 text-center">{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddItem(DRINKS.find(d => d.name === item.name)!)}>
                                  <PlusCircle className="h-4 w-4"/>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleClearItem(item.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
          <CardFooter className="flex-col !p-4 !pt-0 mt-auto bg-card">
            <div className="w-full">
                <Separator className="my-4"/>
                <h4 className="font-headline text-lg mb-2">Payment Method</h4>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                    <Button
                        key={id}
                        variant={paymentMethod === id ? 'default' : 'outline'}
                        onClick={() => handleSetPaymentMethod(id)}
                        className="flex flex-col h-16"
                    >
                        <Icon className="h-6 w-6 mb-1" />
                        <span className="text-xs">{label}</span>
                    </Button>
                    ))}
                </div>
                <Separator className="my-4"/>
                <div className="flex justify-between items-center mb-4">
                <span className="font-headline text-lg">Total</span>
                <span className="font-headline text-3xl font-bold">{totalAmount.toFixed(2)} THB</span>
                </div>
            </div>
            <Button size="lg" className="w-full font-bold text-lg" onClick={handleSubmitOrder} disabled={isPending || orderItems.length === 0}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {showQr ? 'Confirming...' : 'Submitting...'}
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
    </>
  );
}
