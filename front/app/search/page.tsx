'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import SearchPage from '@/components/pages/SearchPage';

export default function Search() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="flex-1">
        <SearchPage />
      </main>
      
      {/* フッター */}
      <Footer />
    </div>
  );
}
