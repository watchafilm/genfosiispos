
'use client';

import { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QrCode, CreditCard, PlusCircle, MinusCircle, Trash2, Loader2, CheckCircle, XCircle, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  { id: 'qr', label: 'QR Scan', icon: QrCode },
  { id: 'credit_card_qr', label: 'Credit Card QR', icon: CreditCard },
];

const DISCOUNT_PRESETS = [5, 10, 15, 20];

export default function OrderPanel() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [customDiscount, setCustomDiscount] = useState('');
  const { firestore } = useFirebase();

  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [orderItems]);

  const totalAmount = useMemo(() => {
    const finalDiscount = parseFloat(customDiscount) || discount;
    const discountedTotal = subtotal - finalDiscount;
    return discountedTotal > 0 ? discountedTotal : 0;
  }, [subtotal, discount, customDiscount]);

  const handleSetPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'qr' || method === 'credit_card_qr') {
        const url = QR_CODE_URLS[method as keyof typeof QR_CODE_URLS];
        setQrCodeUrl(url);
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

  const applyDiscountPercentage = (percentage: number) => {
    const discountAmount = (subtotal * percentage) / 100;
    setDiscount(discountAmount);
    setCustomDiscount(''); // Clear custom discount
  };

  const handleCustomDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDiscount(value);
    if (value) {
      setDiscount(0); // Clear percentage discount
    }
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
        const finalDiscount = parseFloat(customDiscount) || discount;
        addDocumentNonBlocking(ordersCollection, {
          items: orderItems,
          subtotal,
          discount: finalDiscount,
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
        setPaymentMethod('qr');
        setDiscount(0);
        setCustomDiscount('');
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

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 grid grid-cols-5 grid-rows-3 gap-4">
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

      <div className="lg:col-span-1 flex flex-col h-full">
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
            <div className="relative flex-grow min-h-[150px] overflow-auto">
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
                <h4 className="font-headline text-lg mb-2">Discount</h4>
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {DISCOUNT_PRESETS.map((p) => (
                        <Button key={p} variant="outline" onClick={() => applyDiscountPercentage(p)}>
                            {p}%
                        </Button>
                    ))}
                </div>
                <div className="relative mb-4">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="number"
                        placeholder="Discount amount (THB)"
                        value={customDiscount}
                        onChange={handleCustomDiscountChange}
                        className="pl-10"
                    />
                </div>

                <Separator className="my-4"/>
                <h4 className="font-headline text-lg mb-2">Payment Method</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} THB</span>
                  </div>
                   {(discount > 0 || parseFloat(customDiscount) > 0) && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Discount</span>
                      <span className="text-red-500">
                        -{(parseFloat(customDiscount) || discount).toFixed(2)} THB
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="font-headline">Total</span>
                    <span className="font-headline text-3xl">{totalAmount.toFixed(2)} THB</span>
                  </div>
                </div>
            </div>
            <Button size="lg" className="w-full font-bold text-lg mt-4" onClick={handleSubmitOrder} disabled={isPending || orderItems.length === 0}>
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

    
    