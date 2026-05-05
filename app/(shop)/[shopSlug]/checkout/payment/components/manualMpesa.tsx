"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Copy, Check, CreditCard, Smartphone, Building, Send, PartyPopper, ShoppingBag, Package, Clock, Shield, Wallet } from "lucide-react";
import { useShop } from "@/app/(shop)/ShopContext";
import { useAuth } from "@/context/authcontext";
import { storeRedirect } from "@/lib/redirect/helper";

interface DirectMpesaPaymentProps {
  orderId: string | null;
  orderNumber: string | null;
  totalAmount?: number | null;
  mpesaInfo: {
    type: 'paybill' | 'till' | 'pochi' | 'send_money';
    business_number: string | null;
    account_number: string | null;
    till_number: string | null;
    phone_number: string | null;
  };
}

export function DirectMpesaPayment({ orderId, orderNumber, totalAmount, mpesaInfo }: DirectMpesaPaymentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { shop } = useShop();
  const { isAuthenticated } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Check if we're in success state from URL
  const isSuccessState = searchParams.get('status') === 'success';
  const [orderComplete, setOrderComplete] = useState(isSuccessState);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const safeOrderNumber = orderNumber || "N/A";
  const safeOrderId = orderId || "";
  const safeTotalAmount = totalAmount || 0;

  const handleOrderComplete = () => {
    setOrderComplete(true);
    // Update URL to include success status
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('status', 'success');
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentDetails = () => {
    switch (mpesaInfo.type) {
      case 'paybill':
        return {
          title: "Paybill Payment",
          icon: <Building className="w-6 h-6" style={{ color: shop?.secondaryColor }} />,
          instructions: [
            "Go to M-Pesa > Lipa na M-Pesa > Paybill",
            `Enter Business Number: ${mpesaInfo.business_number}`,
            `Enter Account Number: ${mpesaInfo.account_number || safeOrderNumber}`,
            `Enter Amount: ${formatAmount(safeTotalAmount)}`,
            "Enter your M-Pesa PIN"
          ],
          copyItems: [
            { label: "Business Number", value: mpesaInfo.business_number, key: "Business Number" },
            { label: "Account Number", value: mpesaInfo.account_number || safeOrderNumber, key: "Account Number" }
          ]
        };
      
      case 'till':
        return {
          title: "Till Number Payment",
          icon: <CreditCard className="w-6 h-6" style={{ color: shop?.secondaryColor }} />,
          instructions: [
            "Go to M-Pesa > Lipa na M-Pesa > Till Number",
            `Enter Till Number: ${mpesaInfo.till_number}`,
            `Enter Amount: ${formatAmount(safeTotalAmount)}`,
            "Enter your M-Pesa PIN"
          ],
          copyItems: [
            { label: "Till Number", value: mpesaInfo.till_number, key: "Till Number" }
          ]
        };
      
      case 'pochi':
        return {
          title: "Pochi La Tambua",
          icon: <Smartphone className="w-6 h-6" style={{ color: shop?.secondaryColor }} />,
          instructions: [
            "Go to M-Pesa > Lipa na M-Pesa > Pochi La Tambua",
            `Enter Pochi Number: ${mpesaInfo.till_number}`,
            `Enter Amount: ${formatAmount(safeTotalAmount)}`,
            "Enter your M-Pesa PIN"
          ],
          copyItems: [
            { label: "Pochi Number", value: mpesaInfo.till_number, key: "Pochi Number" }
          ]
        };
      
      case 'send_money':
        return {
          title: "Send Money",
          icon: <Send className="w-6 h-6" style={{ color: shop?.secondaryColor }} />,
          instructions: [
            "Go to M-Pesa > Send Money",
            `Enter Phone Number: ${mpesaInfo.phone_number}`,
            `Enter Amount: ${formatAmount(safeTotalAmount)}`,
            `Use Reference: ${safeOrderNumber}`,
            "Enter your M-Pesa PIN"
          ],
          copyItems: [
            { label: "Phone Number", value: mpesaInfo.phone_number, key: "Phone Number" },
            { label: "Reference", value: safeOrderNumber, key: "Reference" }
          ]
        };
      
      default:
        return null;
    }
  };

  const paymentDetails = getPaymentDetails();
  
  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Please contact the shop for payment instructions.</p>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500">Order Number</p>
              <p className="font-semibold text-sm text-gray-900">{safeOrderNumber}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    const TrackOrderButton = () => {
      if (isAuthenticated) {
        return (
          <button
            onClick={() => router.push(`/${shop?.shopSlug}/profile`)}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all"
            style={{ backgroundColor: shop?.secondaryColor }}
          >
            Track Your Order
          </button>
        );
      }
      
      const handleSignInClick = () => {
        // Build current URL with success state
        const currentFullPath = `${pathname}?order_id=${safeOrderId}&status=success`;
        storeRedirect(currentFullPath);
        router.push('/auth/login');
      };
      
      return (
        <div className="space-y-2">
          <button
            onClick={handleSignInClick}
            className="w-full py-3 px-4 rounded-lg text-white font-medium text-center block"
            style={{ backgroundColor: shop?.secondaryColor }}
          >
            Sign in to Track Order
          </button>
          <p className="text-xs text-gray-500 text-center">
            Sign in to view your order history
          </p>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative p-8 text-center bg-gradient-to-br from-green-500 to-emerald-600">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <PartyPopper className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Order Complete! 🎉</h1>
              <p className="text-green-50 text-sm">Thank you for your purchase</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Order Number</p>
                <p className="text-xl font-bold text-gray-900">{safeOrderNumber}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2" style={{ color: shop?.secondaryColor }}>
                  <Wallet className="w-12 h-12" />
                </div>
                <p className="text-gray-700 text-sm">Your order has been placed successfully!</p>
              </div>
              <div className="space-y-2 pt-2">
                <TrackOrderButton />
                <button
                  onClick={() => router.push(`/${shop?.shopSlug}`)}
                  className="w-full py-3 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b border-gray-200 shadow-sm bg-[url('/assets/maze-speciallll.svg')] bg-repeat bg-[length:400px_auto]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${shop?.secondaryColor}10` }}>
                  {paymentDetails.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
                  <p className="text-sm text-gray-500">{paymentDetails.title}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              {paymentDetails.copyItems.map((item, idx) => (
                <div key={idx} className="flex-1 lg:flex-none bg-gray-50 rounded-lg px-4 py-2 min-w-[180px]">
                  <p className="text-xs text-gray-700">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-gray-900 text-xl">{item.value || "N/A"}</p>
                    {item.value && (
                      <button
                        onClick={() => copyToClipboard(item.value as string, item.key)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        type="button"
                      >
                        {copiedField === item.key ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="bg-green-50 rounded-lg px-4 py-2 min-w-[140px] border border-green-200">
                <p className="text-xs text-green-700 font-medium">Total Amount</p>
                <p className="font-bold text-gray-900 text-lg">{formatAmount(safeTotalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                <Smartphone className="w-5 h-5" style={{ color: shop?.secondaryColor }} />
                <h2 className="text-lg font-semibold text-gray-900">Payment Instructions</h2>
              </div>
              <div className="space-y-4">
                {paymentDetails.instructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${shop?.secondaryColor}15` }}>
                      <span className="text-xs font-bold" style={{ color: shop?.secondaryColor }}>{idx + 1}</span>
                    </div>
                    <span className="text-gray-800 text-base">{instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-gray-800">
                  After completing payment in M-Pesa, click the button to confirm your order.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${shop?.secondaryColor}10` }}>
                  <Wallet className="w-8 h-8" style={{ color: shop?.secondaryColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Order #{safeOrderNumber}
                </p>
              </div>

              <button
                onClick={handleOrderComplete}
                className="w-full py-3 px-4 rounded-lg text-white font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-md"
                style={{ backgroundColor: shop?.secondaryColor }}
              >
                <Check className="w-4 h-4" />
                I've Completed Payment
              </button>

              <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-800">
                <Clock className="w-3 h-3" />
                <span>Click only after payment is complete</span>
              </div>
            </div>

            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-800">Having trouble?</p>
              <p className="text-xs text-gray-800 mt-1">Contact support with your order number</p>
              <p className="font-mono text-sm font-bold text-gray-900 mt-2">{safeOrderNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}