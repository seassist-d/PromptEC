'use client';

import { useState, FormEvent } from 'react';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    privacy: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.privacy) {
      setSubmitStatus('error');
      setSubmitMessage('プライバシーポリシーに同意してください');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          privacy: formData.privacy,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(data.message || 'お問い合わせを受け付けました。');
        
        // フォームをリセット
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          privacy: false,
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'お問い合わせの送信に失敗しました。');
      }
    } catch (error) {
      console.error('Contact submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage('通信エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">お問い合わせ</h1>
            
            <div className="text-sm text-gray-600 mb-8">
              <p>ご不明な点やご質問がございましたら、以下からお問い合わせください。</p>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              {/* 連絡先 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">連絡先</h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">メールアドレス</p>
                    <p className="text-gray-600">support@promptec.com</p>
                  </div>
                  <div>
                    <p className="font-semibold">対応時間</p>
                    <p className="text-gray-600">平日 10:00-18:00（土日祝日を除く）</p>
                  </div>
                  <div>
                    <p className="font-semibold">返信まで</p>
                    <p className="text-gray-600">通常3営業日以内にご返信いたします</p>
                  </div>
                </div>
              </section>

              {/* お問い合わせフォーム */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせフォーム</h2>
                <p className="mb-4 text-gray-600">
                  以下のフォームからお気軽にお問い合わせください。
                </p>
                
                {/* ステータスメッセージ */}
                {submitStatus !== 'idle' && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      submitStatus === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {submitMessage}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">選択してください</option>
                      <option value="account">アカウントに関する質問</option>
                      <option value="purchase">購入・決済に関する質問</option>
                      <option value="sale">販売に関する質問</option>
                      <option value="bug">バグや不具合の報告</option>
                      <option value="feature">機能要望</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={8}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="privacy"
                      name="privacy"
                      checked={formData.privacy}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="mt-1 mr-2 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="privacy" className="text-sm text-gray-600">
                      <a href="/privacy" className="text-blue-600 hover:text-blue-800">プライバシーポリシー</a>に同意します <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          送信中...
                        </span>
                      ) : (
                        '送信する'
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* よくある質問 */}
              <section className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">よくある質問</h2>
                <p className="mb-3 text-gray-600">
                  よくある質問については、<a href="/faq" className="text-blue-600 hover:text-blue-800">FAQページ</a>をご確認ください。
                </p>
              </section>

              {/* その他の情報 */}
              <section className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">その他の情報</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    <a href="/terms" className="text-blue-600 hover:text-blue-800">利用規約</a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-blue-600 hover:text-blue-800">プライバシーポリシー</a>
                  </li>
                  <li>
                    <a href="/faq" className="text-blue-600 hover:text-blue-800">よくある質問（FAQ）</a>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      {/* フッター */}
      <Footer />
    </div>
  );
}

