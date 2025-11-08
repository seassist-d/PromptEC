'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  prompt_version_id: string;
  unit_price_jpy: number;
  prompt_versions?: {
    id: string;
    version: number;
    title_snapshot?: string;
    prompts?: {
      id: string;
      title: string;
      slug: string;
      thumbnail_url?: string;
      short_description?: string;
    };
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  order_items: OrderItem[];
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const hasDownloaded = useRef(false); // 自動ダウンロードが実行されたかどうかを追跡

  useEffect(() => {
    // 注文情報を取得
    const fetchOrderData = async () => {
      if (orderId) {
        try {
          // 特定の注文のみを取得
          const res = await fetch(`/api/orders?orderId=${orderId}`);
          const data = await res.json();
          
          if (!data.orders || data.orders.length === 0) {
            setLoading(false);
            return;
          }
          
          const order: Order = data.orders[0];
          
          if (order) {
            // prompt_versionsがnullの場合、クライアント側で直接取得
            const itemsWithPrompts = await Promise.all(
              (order.order_items || []).map(async (item: any) => {
                if (!item.prompt_versions && item.prompt_version_id) {
                  try {
                    const response = await fetch(`/api/prompt-versions/${item.prompt_version_id}`);
                    if (response.ok) {
                      const promptVersion = await response.json();
                      return { ...item, prompt_versions: promptVersion };
                    }
                  } catch (error) {
                    console.error('prompt_versions取得エラー:', error);
                  }
                }
                return item;
              })
            );
            
            setOrderItems(itemsWithPrompts);
          }
          setLoading(false);
        } catch (err) {
          console.error('注文情報取得エラー:', err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // 自動ダウンロード処理
  useEffect(() => {
    // 注文アイテムが取得できて、まだダウンロードしていない場合
    if (!loading && orderItems.length > 0 && orderId && !hasDownloaded.current) {
      // 少し待ってからダウンロードを開始（ページが完全に読み込まれた後、entitlementsが作成されるのを待つ）
      const timer = setTimeout(async () => {
        for (let index = 0; index < orderItems.length; index++) {
          const item = orderItems[index];
          
          // 各ファイルを少しずつ遅延させてダウンロード（ブラウザの同時ダウンロード制限を考慮）
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒間隔でダウンロード
          }
          
          // リトライ機能: entitlementsが作成されるまで最大5回リトライ
          let retryCount = 0;
          const maxRetries = 5;
          let success = false;
          
          while (retryCount < maxRetries && !success) {
            try {
              const downloadUrl = `/api/download/${orderId}/${item.id}`;
              const response = await fetch(downloadUrl);
              
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                // ファイル名を取得（Content-Dispositionヘッダーから）
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `prompt_${item.id}.txt`;
                if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                  if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                    // URLデコード
                    try {
                      filename = decodeURIComponent(filename);
                    } catch (e) {
                      // デコードに失敗した場合はそのまま使用
                    }
                  }
                }
                
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                success = true;
              } else {
                // 403エラー（権限なし）や400エラー（支払い未完了）の場合はリトライ
                if ((response.status === 403 || response.status === 400) && retryCount < maxRetries - 1) {
                  retryCount++;
                  await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                } else {
                  break; // リトライを諦める
                }
              }
            } catch (error) {
              console.error('ダウンロードエラー:', error);
              if (retryCount < maxRetries - 1) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
              } else {
                break;
              }
            }
          }
        }
        hasDownloaded.current = true;
      }, 2000); // ページ読み込み後2秒待つ（entitlementsの作成を待つ）

      return () => clearTimeout(timer);
    }
  }, [loading, orderItems, orderId]);

  const handleDownload = async (itemId: string) => {
    if (!orderId) return;
    try {
      const downloadUrl = `/api/download/${orderId}/${itemId}`;
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // ファイル名を取得（Content-Dispositionヘッダーから）
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `prompt_${itemId}.txt`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            // URLデコード
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // デコードに失敗した場合はそのまま使用
            }
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error(`ダウンロード失敗: ${response.status} ${response.statusText}`);
        alert('ダウンロードに失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('ダウンロードに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">購入完了</h1>
          <p className="text-gray-600 mb-8">
            ご購入ありがとうございました。注文が正常に処理されました。
            {orderItems.length > 0 && !hasDownloaded.current && (
              <span className="block mt-2 text-sm text-blue-600">
                プロンプトファイルを自動的にダウンロードしています...
              </span>
            )}
          </p>

          {/* 購入した商品 */}
          {loading ? (
            <div className="mb-6 text-center text-gray-600">読み込み中...</div>
          ) : orderItems.length > 0 ? (
            <div className="mb-6 space-y-3">
              {orderItems.map((item) => {
                // タイトルを取得（優先順位: title_snapshot > prompts.title > デフォルト）
                const title = item.prompt_versions?.title_snapshot || 
                             item.prompt_versions?.prompts?.title || 
                             'プロンプト';
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <p className="text-sm text-gray-600 mb-2">購入した商品</p>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {title}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(item.id)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        ダウンロード
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3">
            <Link
              href="/profile"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              購入履歴を見る
            </Link>

            <Link
              href="/search"
              className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              他のプロンプトを探す
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

