import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: '利用規約 - PromptEC',
  description: 'PromptECの利用規約です。',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
            
            <div className="text-sm text-gray-600 mb-8">
              <p>最終更新日: 2024年1月1日</p>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              {/* 第1条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（適用）</h2>
                <p className="mb-3">
                  本規約は、PromptEC（以下「当社」といいます）が提供するサービス（以下「本サービス」といいます）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って、本サービスをご利用いただきます。
                </p>
              </section>

              {/* 第2条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（利用登録）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
                  <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。</li>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>反社会的勢力等（暴力団、暴力団員、右翼団体、 Antisocial Forces、その他これに準ずる者を意味します。以下同じ。）である、または資金提供その他を通じて反社会的勢力等の維持、運営若しくは経営に協力若しくは関与する等反社会的勢力等と何らかの交流若しくは関与を行っていると当社が判断した場合</li>
                    <li>その他、当社が利用登録を相当でないと判断した場合</li>
                  </ul>
                </ol>
              </section>

              {/* 第3条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（ユーザーIDおよびパスワードの管理）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
                  <li>ユーザーIDまたはパスワードが第三者に使用されたことによって生じた損害は、当社に故意または重大な過失がある場合を除き、当社は一切の責任を負わないものとします。</li>
                </ol>
              </section>

              {/* 第4条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（利用料金および支払方法）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>ユーザーは、本サービスの利用において発生する利用料金を、当社が別途定め、本サービスに表示するところに従い、当社が指定する方法により支払うものとします。</li>
                  <li>ユーザーが利用料金の支払を遅滞した場合、ユーザーは年14.6％の割合による遅延損害金を当社に支払うものとします。</li>
                </ol>
              </section>

              {/* 第5条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（商品またはサービス等の販売）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>本サービスにおいて販売される商品またはサービス等（以下「販売商品等」といいます）は、ユーザーが販売するものであり、当社が販売するものではありません。</li>
                  <li>ユーザーは、販売商品等について、自らがその内容、品質、数量等に責任を負うものとし、当社は、販売商品等に関する一切の責任を負わないものとします。</li>
                  <li>ユーザーは、販売商品等の内容が法令、本規約または公序良俗に反しないよう、適切に販売商品等を取り扱うものとします。</li>
                </ol>
              </section>

              {/* 第6条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（禁止事項）</h2>
                <p className="mb-3">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                  <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>本サービスによって得られた情報を商業的に利用する行為</li>
                  <li>当社のサービスの運営を妨害するおそれのある行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>不正な目的を持って本サービスを利用する行為</li>
                  <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ol>
              </section>

              {/* 第7条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（本サービスの提供の停止等）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</li>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                    <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                    <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                    <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                  </ul>
                  <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
                </ol>
              </section>

              {/* 第8条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（保証の否認および免責）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                  <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約に該当する場合、この免責規定は適用されません。</li>
                  <li>前項ただし書に定める場合であっても、当社は、当社の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（当社またはユーザーが損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。</li>
                </ol>
              </section>

              {/* 第9条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（サービス内容の変更等）</h2>
                <p className="mb-3">
                  当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあるものとします。
                </p>
              </section>

              {/* 第10条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条（利用規約の変更）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>当社は以下の場合には、ユーザーの個別の同意を得ることなく、本規約を変更することができるものとします。</li>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>本規約の変更がユーザーの一般の利益に適合するとき</li>
                    <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他変更に係る事情に照らして合理的なものであるとき</li>
                  </ul>
                  <li>当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨および変更後の本規約の内容並びにその効力発生時期を通知します。</li>
                </ol>
              </section>

              {/* 第11条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第11条（個人情報の取扱い）</h2>
                <p className="mb-3">
                  当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                </p>
              </section>

              {/* 第12条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第12条（通知または連絡）</h2>
                <p className="mb-3">
                  ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
                </p>
              </section>

              {/* 第13条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第13条（権利義務の譲渡の禁止）</h2>
                <p className="mb-3">
                  ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
                </p>
              </section>

              {/* 第14条 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">第14条（準拠法・裁判管轄）</h2>
                <ol className="list-decimal pl-6 mb-3 space-y-2">
                  <li>本規約の解釈にあたっては、日本法を適用することとします。</li>
                  <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
                </ol>
              </section>

              {/* お問い合わせ */}
              <section className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ</h2>
                <p className="mb-3">
                  本規約に関するお問い合わせは、以下までご連絡ください。
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

