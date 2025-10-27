'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

interface StripeCheckoutFormProps {
  orderId: string;
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

export default function StripeCheckoutForm({
  orderId,
  amount,
  onSuccess,
  onError
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripeが初期化されていません');
      return;
    }

    setIsProcessing(true);

    try {
      // PaymentIntentを作成（まだ作成されていない場合のみ）
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PaymentIntentの作成に失敗しました');
      }

      const { clientSecret } = await response.json();
      
      if (!clientSecret) {
        throw new Error('clientSecretが取得できませんでした');
      }

      // Stripeで決済を確認
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('CardElementが見つかりません');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer Name', // TODO: 実際のユーザー名を取得
          },
        },
      });

      if (error) {
        console.error('Stripe決済エラー:', error);
        
        // 日本語のエラーメッセージに変換
        let errorMessage = error.message;
        if (error.message.includes('test mode')) {
          errorMessage = 'テスト用のカード番号を使用してください: 4242 4242 4242 4242';
        }
        
        throw new Error(errorMessage);
      }

      console.log('PaymentIntentステータス:', paymentIntent?.status);

      if (paymentIntent?.status === 'succeeded') {
        console.log('決済成功！台帳エントリーを作成します...');
        
        // 決済が成功したら、既存の決済APIを呼び出して台帳エントリーを作成
        const paymentResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            paymentMethod: 'card',
            stripePaymentIntentId: paymentIntent.id,
          }),
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          console.error('決済APIエラー:', errorData);
          throw new Error(errorData.error || '決済レコードの作成に失敗しました');
        }

        const paymentResult = await paymentResponse.json();
        console.log('決済APIレスポンス:', paymentResult);

        console.log('台帳エントリー作成完了！');
        onSuccess(orderId);
      }
    } catch (err) {
      console.error('Stripe決済エラー:', err);
      onError(err instanceof Error ? err.message : '決済処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>テストモード:</strong> 以下のカード情報をご使用ください
        </p>
        <p className="text-sm text-yellow-800 mt-1">
          カード番号: <code className="bg-yellow-100 px-2 py-1 rounded">4242 4242 4242 4242</code> | 
          有効期限: 12/34 | CVC: 123 | 郵便番号: 12345
        </p>
      </div>

      <div className="p-4 border border-gray-300 rounded-lg bg-white">
        <CardElement options={cardStyle} />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? '処理中...' : `¥${amount.toLocaleString()}を支払う`}
      </button>
    </form>
  );
}

