import Link from 'next/link';

export default function Footer() {
  // ここでは外部SNSは使用しない（要望により削除）

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-8 sm:gap-y-0 sm:gap-x-0 w-full">
          {/* 1列目: 会員情報 */}
          <div className="px-0 sm:pl-0 lg:pl-43 sm:pr-6 pb-3">
          <nav className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">会員情報</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><Link href="/profile" className="hover:text-blue-600">会員情報</Link></li>
              <li><Link href="/cart" className="hover:text-blue-600">カートを確認</Link></li>
              <li><Link href="/prompts/create" className="hover:text-blue-600">プロンプトを販売する</Link></li>
              <li><Link href="/search" className="hover:text-blue-600">プロンプトを探す</Link></li>
            </ul>
          </nav>
          </div>

          {/* 2列目: カテゴリ */}
          <div className="px-0 sm:px-6 sm:min-w-[340px] lg:min-w-[450px] pb-3">
          <nav className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">カテゴリ</h3>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 pb-2 text-sm text-gray-700">
              <li><Link href="/search?category=writer" className="hover:text-blue-600">ライター・編集者</Link></li>
              <li><Link href="/search?category=sales" className="hover:text-blue-600">営業・カスタマーサポート</Link></li>
              <li><Link href="/search?category=designer" className="hover:text-blue-600">デザイナー・クリエイター</Link></li>
              <li><Link href="/search?category=developer" className="hover:text-blue-600">プログラマー・開発者</Link></li>
              <li><Link href="/search?category=hr" className="hover:text-blue-600">人事・採用担当</Link></li>
              <li><Link href="/search?category=manager" className="hover:text-blue-600">経営者・マネージャー</Link></li>
              <li><Link href="/search?category=finance" className="hover:text-blue-600">金融・会計</Link></li>
              <li><Link href="/search?category=marketing" className="hover:text-blue-600">マーケティング・広告</Link></li>
              <li><Link href="/search?category=health" className="hover:text-blue-600">医療・ヘルスケア</Link></li>
              <li><Link href="/search?category=research" className="hover:text-blue-600">研究・開発</Link></li>
            </ul>
          </nav>
          </div>

          {/* 3列目: サポート */}
          <div className="px-0 sm:pl-12 lg:pl-26 pb-3">
          <nav className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">サポート</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><Link href="/terms" className="hover:text-blue-600">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">プライバシーポリシー</Link></li>
              <li><Link href="/faq" className="hover:text-blue-600">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">お問い合わせ</Link></li>
            </ul>
          </nav>
          </div>
        </div>
        
      </div>
      {/* 著作権情報: 全幅の暗色背景 + 縦中央揃え */}
      <div className="border-t border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="h-8 flex items-center justify-center">
            <p className="text-[11px] text-white leading-none">&copy; {new Date().getFullYear()} PromptEC</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
