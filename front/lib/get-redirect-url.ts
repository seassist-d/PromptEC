/**
 * 動的にリダイレクトURLを生成するユーティリティ関数
 * クライアントサイドとサーバーサイドの両方で使用可能
 */

export function getRedirectUrl(): string {
  // クライアントサイドの場合
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return `${baseUrl}/auth/callback`;
  }
  
  // サーバーサイドの場合
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  }
  
  // デフォルト値
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || 'localhost';
  return `http://${host}:${port}/auth/callback`;
}

/**
 * 現在のサイトのベースURLを取得
 */
export function getBaseUrl(): string {
  // クライアントサイドの場合
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  
  // サーバーサイドの場合
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // デフォルト値
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || 'localhost';
  return `http://${host}:${port}`;
}
