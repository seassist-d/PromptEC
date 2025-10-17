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
  
  // サーバーサイドの場合
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('Server-side redirect URL from env:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  }
  
  // デフォルト値
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || 'localhost';
  const defaultUrl = `http://${host}:${port}/auth/callback`;
  console.log('Default redirect URL:', defaultUrl);
  return defaultUrl;
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
