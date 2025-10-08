'use client'

import { useState, useTransition, useActionState, useEffect } from 'react'
import { signUpAction, type SignUpFormState } from '@/app/actions/auth'

export default function SignUpForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup')
  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useActionState(signUpAction, {})

  // 登録成功時にログインフォームに切り替える
  useEffect(() => {
    if (state.message && !state.errors) {
      const timer = setTimeout(() => {
        setActiveTab('login')
      }, 3000) // 3秒後にログインフォームに切り替え
      
      return () => clearTimeout(timer)
    }
  }, [state.message, state.errors])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー（簡易） */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            プロンプトEC
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            プロンプトを売買しよう
          </p>
        </div>

        {/* タブ切り替え */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            新規登録
          </button>
        </div>

        {/* フォームエリア */}
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {activeTab === 'signup' ? (
            <>
              {/* 新規登録フォーム */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">アカウント作成</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    新しいアカウントを作成してプロンプトを売買しましょう
                  </p>
                </div>

                {/* エラーメッセージ */}
                {state.message && (
                  <div className={`p-4 rounded-md ${
                    state.errors ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm ${
                      state.errors ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {state.message}
                    </p>
                    {!state.errors && (
                      <div className="mt-3">
                        <p className="text-xs text-green-600 mb-2">
                          3秒後にログインフォームに切り替わります
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('login')}
                          className="text-sm text-green-600 hover:text-green-500 font-medium underline"
                        >
                          今すぐログインフォームに切り替える
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 外部連携ボタン */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Googleで登録
                  </button>
                  
                  <button
                    type="button"
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.04 12.261c0-1.892-.154-3.716-.432-5.442H12v10.325h6.24c-.276 1.487-1.104 2.748-2.352 3.596v2.95h3.808c2.23-2.053 3.515-5.073 3.515-8.429z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    </svg>
                    Microsoftで登録
                  </button>
                </div>

                {/* 区切り線 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">または</span>
                  </div>
                </div>

                {/* 新規登録フォーム */}
                <form action={formAction} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="example@email.com"
                    />
                    {state.errors?.email && (
                      <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="6文字以上で入力"
                    />
                    {state.errors?.password && (
                      <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      パスワード（確認）
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="パスワードを再入力"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isPending ? '登録中...' : 'アカウントを作成'}
                  </button>
                </form>

                {/* 利用規約 */}
                <p className="text-xs text-gray-500 text-center">
                  登録することで、
                  <a href="#" className="text-blue-600 hover:text-blue-500">利用規約</a>
                  および
                  <a href="#" className="text-blue-600 hover:text-blue-500">プライバシーポリシー</a>
                  に同意したものとみなされます。
                </p>
              </div>
            </>
          ) : (
            <>
              {/* ログインフォーム（プレースホルダー） */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">ログイン</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    既存のアカウントでログイン
                  </p>
                </div>
                
                <div className="text-center py-8">
                  <p className="text-gray-500">ログイン機能は今後実装予定です</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちの方は
            <button
              onClick={() => setActiveTab('login')}
              className="text-blue-600 hover:text-blue-500 font-medium ml-1"
            >
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
