/**
 * 動的にリダイレクトURLを生成するユーティリティ関数
 * クライアントサイドとサーバーサイドの両方で使用可能
 */

export function getRedirectUrl(): string {
  // クライアントサイドの場合
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    console.log('Client-side redirect URL:', `${baseUrl}/auth/callback`);
    return `${baseUrl}/auth/callback`;
  }
  
  // サーバーサイドの場合 - 動的にポートを検出
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000';
  const host = process.env.HOST || 'localhost';
  
  // 環境変数が設定されている場合はそれを使用
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('Server-side redirect URL from env:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  }
  
  // 動的にポートを検出してURLを生成
  const dynamicUrl = `http://${host}:${port}/auth/callback`;
  console.log('Dynamic redirect URL:', dynamicUrl);
  return dynamicUrl;
}

/**
 * 現在のサイトのベースURLを取得
 */
export function getBaseUrl(): string {
  // クライアントサイドの場合
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    console.log('Client-side base URL:', baseUrl);
    return baseUrl;
  }
  
  // サーバーサイドの場合
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('Server-side base URL from env:', process.env.NEXT_PUBLIC_SITE_URL);
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // デフォルト値
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || 'localhost';
  const defaultUrl = `http://${host}:${port}`;
  console.log('Default base URL:', defaultUrl);
  return defaultUrl;
}
