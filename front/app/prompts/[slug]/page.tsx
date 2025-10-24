'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import PromptDetail from '@/components/prompts/PromptDetail';

export default function PromptDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <PromptDetail slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
