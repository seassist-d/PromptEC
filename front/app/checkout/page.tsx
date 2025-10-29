'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';

// Stripeの初期化
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, itemCount } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);

  const handleCheckout = async () => {
    if (!selectedPayment) {
      setError('支払い方法を選択してください');
      return;
    }

    if (items.length === 0) {
      setError('カートが空です');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: 注文を作成
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedPayment
        })
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        // 詳細なエラーメッセージを取得
        const errorMsg = orderResult.error || '注文処理に失敗しました';
        const errorDetails = orderResult.details ? `\n詳細: ${orderResult.details}` : '';
        throw new Error(`${errorMsg}${errorDetails}`);
      }

      // Stripe決済の場合はStripeフォームを表示
      if (selectedPayment === 'card') {
        setOrderId(orderResult.orderId);
        setShowStripeForm(true);
        setIsProcessing(false);
        return;
      }

      // Step 2: 簡易決済の場合は従来通り処理
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderResult.orderId,
          paymentMethod: selectedPayment
        })
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || '決済処理に失敗しました');
      }

      console.log('決済完了:', paymentResult);

      // 購入完了ページへリダイレクト
      router.push(`/checkout/success?orderId=${orderResult.orderId}`);

    } catch (err) {
      console.error('購入エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '購入処理に失敗しました';
      setError(errorMessage);
      
      // エラーが発生した場合、カートを再取得して表示を更新
      try {
        const cartResponse = await fetch('/api/cart');
        const cartData = await cartResponse.json();
        console.log('エラー後のカート状態:', cartData);
        // 必要に応じてカートデータを再表示する処理を追加
      } catch (cartErr) {
        console.error('カート再取得エラー:', cartErr);
      }
      
      setIsProcessing(false);
    }
  };

  // Stripe決済成功時のコールバック
  const handleStripeSuccess = (orderId: string) => {
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  // Stripe決済エラー時のコールバック
  const handleStripeError = (errorMessage: string) => {
    setError(errorMessage);
    setShowStripeForm(false);
    setOrderId(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">カートが空です</h2>
          <Link
            href="/cart"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            カートに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">購入手続き</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 注文内容 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">注文内容</h2>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-900">{item.prompts?.title || 'プロンプト'}</span>
                    <span className="font-semibold text-gray-900">¥{item.unit_price_jpy.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>合計</span>
                  <span className="text-blue-600">¥{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

              {/* 支払い方法 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">支払い方法</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={selectedPayment === 'card'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">クレジットカード</div>
                    <div className="text-sm text-gray-700">VISA, Mastercard, JCB, American Express</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={selectedPayment === 'paypal'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="mr-3"
                    disabled
                  />
                  <div>
                    <div className="font-semibold text-gray-900">PayPal</div>
                    <div className="text-sm text-gray-700">今後実装予定</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="paypay"
                    checked={selectedPayment === 'paypay'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="mr-3"
                    disabled
                  />
                  <div>
                    <div className="font-semibold text-gray-900">PayPay</div>
                    <div className="text-sm text-gray-700">今後実装予定</div>
                  </div>
                </label>
              </div>

              {/* Stripe Checkout Form */}
              {showStripeForm && orderId && (
                <Elements stripe={stripePromise}>
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">カード情報</h3>
                    <StripeCheckoutForm
                      orderId={orderId}
                      amount={total}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                    />
                  </div>
                </Elements>
              )}
            </div>
          </div>

          {/* 注文概要 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">注文概要</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-800">
                  <span>アイテム数</span>
                  <span>{itemCount}件</span>
                </div>
                <div className="flex justify-between text-gray-800">
                  <span>小計</span>
                  <span>¥{total.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-gray-900">
                  <span>合計</span>
                  <span className="text-blue-600">¥{total.toLocaleString()}</span>
                </div>
              </div>

              {!showStripeForm && (
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || !selectedPayment}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '処理中...' : '購入を確定'}
                </button>
              )}

              <Link
                href="/cart"
                className="block w-full text-center mt-3 text-gray-800 hover:text-gray-900"
              >
                カートに戻る
              </Link>

              <div className="mt-6 text-xs text-gray-700 space-y-1">
                <p>• 価格は税込みです</p>
                <p>• デジタル商品のため返品できません</p>
                <p>• 購入後は無制限にダウンロード可能です</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

