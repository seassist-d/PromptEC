import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "認証 - PromptAssist",
  description: "PromptAssistアカウントのログイン・新規登録",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 背景を微妙に明るいグレーへ（青系撤廃）
  return (
    <div className="min-h-screen bg-zinc-50">
      {children}
    </div>
  );
}
