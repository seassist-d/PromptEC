'use client';

import { ReactNode } from 'react';

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-200 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 font-medium">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

