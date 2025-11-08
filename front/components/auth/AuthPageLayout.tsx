'use client';

import { ReactNode } from 'react';

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthPageLayout({ title, subtitle, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(120deg,#f6f7f8_0%,#eef0f2_50%,#f6f7f8_100%)] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 微細グリッド（非常に薄い） */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      {/* 以前のカラフルなブロブは削除し、落ち着いたバイグラデ影を後景に */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-zinc-300/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-neutral-400/30 blur-3xl" />

      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        {/* ヘッダー：重量級フォント→グラデ無しのインク色 */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h2>
          <p className="text-[15px] sm:text-base text-zinc-600">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
