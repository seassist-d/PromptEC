import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import HomePage from '@/components/pages/HomePage';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1">
        <HomePage />
      </main>
      
      {/* フッター */}
      <Footer />
    </div>
  );
}
