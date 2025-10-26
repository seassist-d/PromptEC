import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'プライバシーポリシー - PromptEC',
  description: 'PromptECのプライバシーポリシーです。',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
            
            <div className="text-sm text-gray-600 mb-8">
              <p>最終更新日: 2024年1月1日</p>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              {/* 基本方針 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 基本方針</h2>
                <p className="mb-3">
                  PromptEC（以下「当社」といいます。）は、お客様の個人情報の保護が重要な責務であることを認識し、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）その他の関連法令を遵守し、適切な取扱いと保護に努めます。
                </p>
              </section>

              {/* 個人情報の定義 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 個人情報の定義</h2>
                <p className="mb-3">
                  本ポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。
                </p>
              </section>

              {/* 個人情報の取得方法 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 個人情報の取得方法</h2>
                <p className="mb-3">当社は、以下の場合に個人情報を取得する場合があります。</p>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>お客様が本サービスに登録する際に、氏名、メールアドレス、その他の登録情報を取得</li>
                  <li>お客様が商品を購入する際に、決済に関する情報（クレジットカード情報等）を取得</li>
                  <li>お問い合わせいただく際に、氏名、メールアドレス、お問い合わせ内容を取得</li>
                  <li>その他、お客様との取引やコミュニケーションを通じて個人情報を取得</li>
                </ol>
              </section>

              {/* 個人情報の利用目的 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 個人情報の利用目的</h2>
                <p className="mb-3">当社は、取得した個人情報を以下の目的で利用します。</p>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>本サービスの提供、維持、改善</li>
                  <li>ユーザーアカウントの管理</li>
                  <li>商品の配送、お支払いの処理</li>
                  <li>お客様へのお知らせ、キャンペーン情報等の送付</li>
                  <li>お問い合わせへの対応</li>
                  <li>不正行為や違法行為の防止</li>
                  <li>統計データの作成・分析</li>
                  <li>法令に基づく対応</li>
                </ol>
              </section>

              {/* Cookie及びその他の技術 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookie及びその他の技術の利用</h2>
                <p className="mb-3">
                  当社は、お客様により良いサービスを提供するため、Cookie（クッキー）その他の技術を使用することがあります。これらの技術により、当社はお客様が本サービスをどのように利用しているかを理解し、お客様のサービス体験を最適化することができます。
                </p>
                <p className="mb-3">
                  お客様は、ブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる場合があります。
                </p>
              </section>

              {/* 個人情報の開示等 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 個人情報の開示等</h2>
                <p className="mb-3">
                  お客様は、当社に対して、当社が保有するお客様の個人情報について、以下の請求を行うことができます。
                </p>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>個人情報の開示</li>
                  <li>個人情報の訂正、追加または削除</li>
                  <li>個人情報の利用停止または消去</li>
                  <li>個人情報の第三者への提供の停止</li>
                </ol>
                <p className="mb-3">
                  前項の請求を行う場合には、当社所定の方法により、お問い合わせ窓口までご連絡ください。当社は、お客様の本人確認を行った上で、合理的な期間内に対応いたします。
                </p>
              </section>

              {/* 個人情報の第三者提供 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. 個人情報の第三者提供</h2>
                <p className="mb-3">
                  当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。
                </p>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>お客様の同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のため特に必要がある場合</li>
                  <li>国の機関等の法令の定める事務の遂行に協力する必要がある場合</li>
                  <li>予め利用目的を公表している場合</li>
                  <li>第三者への提供が個人情報保護法その他の法令により認められる場合</li>
                </ol>
              </section>

              {/* 個人情報の管理 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. 個人情報の管理</h2>
                <p className="mb-3">
                  当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のため、従業者に対する必要かつ適切な監督を行い、個人情報の安全管理が図られるよう、必要かつ適切な措置を講じます。
                </p>
                <p className="mb-3">
                  また、個人情報を取り扱うに当たっては、その利用の目的をできる限り特定し、当該利用の目的に必要な範囲において個人情報を取り扱います。
                </p>
              </section>

              {/* 個人情報の委託 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. 個人情報の委託</h2>
                <p className="mb-3">
                  当社は、利用目的の達成に必要な範囲内において、個人情報の取り扱いの全部または一部を委託することがあります。この場合、当社は、委託先に対し、個人情報の安全管理に必要な措置を講じさせ、適切な監督を行います。
                </p>
              </section>

              {/* 個人情報の保護措置 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. 個人情報の保護措置</h2>
                <p className="mb-3">
                  当社は、個人情報の正確性を保つよう努めるとともに、個人情報への不正アクセス、個人情報の紛失、破壊、改ざん及び漏洩等を防止するため、セキュリティシステムの維持・管理体制の整備・社員教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行います。
                </p>
              </section>

              {/* プライバシーポリシーの変更 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. プライバシーポリシーの変更</h2>
                <p className="mb-3">
                  当社は、法令の改正、個人情報保護に関する社会環境の変化等に応じ、本ポリシーを変更することがあります。変更後の本ポリシーについては、本サービス上での掲示その他、分かりやすい方法により告知いたします。
                </p>
              </section>

              {/* お問い合わせ */}
              <section className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ</h2>
                <p className="mb-3">
                  本ポリシーに関するお問い合わせは、以下までご連絡ください。
                </p>
                <p className="text-sm text-gray-600">
                  PromptEC<br />
                  メールアドレス: support@promptec.com
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

