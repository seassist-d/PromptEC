import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "認証 - PromptEC",
  description: "PromptECにログインまたは新規登録",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
