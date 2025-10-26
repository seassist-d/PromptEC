import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'FAQ - PromptEC',
  description: 'PromptECに関するよくある質問と回答です。',
};

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">よくある質問（FAQ）</h1>
            
            <div className="text-sm text-gray-600 mb-8">
              <p>最終更新日: 2024年1月1日</p>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              {/* プロンプト購入に関する質問 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">プロンプト購入に関する質問</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q1. プロンプトを購入したらどのようにダウンロードできますか？</h3>
                    <p className="text-gray-600 mb-3">
                      プロンプトを購入すると、注文完了メールと同時にダウンロードリンクがお送りされます。また、マイページの注文履歴からもダウンロードできます。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q2. 購入したプロンプトは何度でも使えますか？</h3>
                    <p className="text-gray-600 mb-3">
                      はい、購入したプロンプトは無制限でご利用いただけます。ただし、第三者への転売や再配布は禁止されています。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q3. 購入したプロンプトが期待通りではありませんでした。返品できますか？</h3>
                    <p className="text-gray-600 mb-3">
                      プロンプトはデジタル商品のため、原則として返品は受け付けておりません。詳細な説明やサンプル出力を確認してからご購入ください。商品の説明と実物が大きく異なる場合は、お問い合わせください。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q4. 購入したプロンプトを商用利用してもいいですか？</h3>
                    <p className="text-gray-600 mb-3">
                      各プロンプトのライセンス条件は出品者が設定しております。購入ページの詳細を必ずご確認ください。一般的には個人利用が許可されており、商用利用は追加費用が必要な場合があります。
                    </p>
                  </div>
                </div>
              </section>

              {/* プロンプト販売に関する質問 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">プロンプト販売に関する質問</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q5. プロンプトを出品するにはどうすればいいですか？</h3>
                    <p className="text-gray-600 mb-3">
                      新規登録後、マイページから「新規出品」をクリックしてください。プロンプトのタイトル、説明、価格、カテゴリなどを入力し、審査に提出します。審査通過後に公開されます。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q6. 販売手数料はかかりますか？</h3>
                    <p className="text-gray-600 mb-3">
                      販売金額の10%をプラットフォーム手数料としてお受けしています。残りの90%が出品者の売上となります。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q7. 売上はいつ受け取れますか？</h3>
                    <p className="text-gray-600 mb-3">
                      売上は月末に集計され、翌月末にご指定の口座へ振り込みます。最低出金額は1,000円です。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q8. 出品したプロンプトの価格を変更できますか？</h3>
                    <p className="text-gray-600 mb-3">
                      はい、マイページから出品中のプロンプトを編集し、価格を変更できます。ただし、すでに購入済みのユーザーへの影響はありません。
                    </p>
                  </div>
                </div>
              </section>

              {/* 決済に関する質問 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">決済に関する質問</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q9. どのような決済方法が利用できますか？</h3>
                    <p className="text-gray-600 mb-3">
                      クレジットカード（Visa、Mastercard、JCB）、Stripe、PayPal、PayPayがご利用いただけます。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q10. 決済は安全ですか？</h3>
                    <p className="text-gray-600 mb-3">
                      はい、セキュリティ対策を徹底しています。すべての決済処理はSSL暗号化通信を使用し、クレジットカード情報は当社では保管せず、決済代行業者にて厳重に管理されています。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q11. 請求書や領収書は発行されますか？</h3>
                    <p className="text-gray-600 mb-3">
                      はい、ご購入完了後にメールで領収書が自動送信されます。マイページからも再発行が可能です。
                    </p>
                  </div>
                </div>
              </section>

              {/* アカウントに関する質問 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">アカウントに関する質問</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q12. アカウントを削除したい場合はどうすればいいですか？</h3>
                    <p className="text-gray-600 mb-3">
                      マイページの設定から「アカウント削除」を選択してください。アカウント削除後は、未使用の残高は戻りません。また、出品中のプロンプトがある場合は、事前に削除してください。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q13. パスワードを忘れてしまいました。どうすればいいですか？</h3>
                    <p className="text-gray-600 mb-3">
                      ログイン画面の「パスワードを忘れた方」からパスワードリセットが可能です。登録メールアドレスにリセットリンクを送信します。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q14. SNSアカウントで登録した後、メールアドレスを変更できますか？</h3>
                    <p className="text-gray-600 mb-3">
                      はい、マイページの設定からメールアドレスを変更できます。変更手続きには認証メールが必要です。
                    </p>
                  </div>
                </div>
              </section>

              {/* その他の質問 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">その他の質問</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q15. アフィリエイトプログラムはありますか？</h3>
                    <p className="text-gray-600 mb-3">
                      現在、アフィリエイトプログラムは提供しておりません。今後の予定についてはお知らせにてご案内いたします。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q16. 特定商取引法に基づく表記はどこにありますか？</h3>
                    <p className="text-gray-600 mb-3">
                      特定商取引法に基づく表記は<a href="/terms" className="text-blue-600 hover:text-blue-800">利用規約</a>ページに記載されています。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q17. 個人情報の取り扱いについて教えてください</h3>
                    <p className="text-gray-600 mb-3">
                      個人情報の取り扱いについては<a href="/privacy" className="text-blue-600 hover:text-blue-800">プライバシーポリシー</a>をご確認ください。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Q18. 問い合わせ先は？</h3>
                    <p className="text-gray-600 mb-3">
                      ご不明な点がございましたら、以下のメールアドレスまたは<a href="/contact" className="text-blue-600 hover:text-blue-800">お問い合わせフォーム</a>からご連絡ください。<br />
                      メールアドレス: support@promptec.com
                    </p>
                  </div>
                </div>
              </section>

              {/* お問い合わせ */}
              <section className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">さらにサポートが必要な場合</h2>
                <p className="mb-3">
                  このFAQで解決しない場合は、以下までお気軽にお問い合わせください。
                </p>
                <p className="text-sm text-gray-600">
                  PromptEC カスタマーサポート<br />
                  メールアドレス: support@promptec.com<br />
                  対応時間: 平日 10:00-18:00（土日祝日を除く）
                </p>
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

