'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface SignUpFormState {
  message?: string
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
}

export async function signUpAction(
  prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  try {
    // 環境変数の確認
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return {
        message: 'サーバー設定エラーが発生しました',
        errors: {
          general: ['システム設定に問題があります。管理者にお問い合わせください。']
        }
      }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // バリデーション
    const errors: SignUpFormState['errors'] = {}

    if (!email) {
      errors.email = ['メールアドレスは必須です']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ['有効なメールアドレスを入力してください']
    }

    if (!password) {
      errors.password = ['パスワードは必須です']
    } else if (password.length < 6) {
      errors.password = ['パスワードは6文字以上で入力してください']
    }

    if (password !== confirmPassword) {
      errors.password = ['パスワードが一致しません']
    }

    if (Object.keys(errors).length > 0) {
      return {
        message: '入力内容にエラーがあります',
        errors
      }
    }

    // Supabaseで新規登録
    console.log('Attempting to create user with email:', email)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // メール確認をスキップ（開発用）
    })

    console.log('Supabase response data:', data)
    console.log('Supabase response error:', error)

    if (error) {
      console.error('Sign up error details:', {
        message: error.message,
        status: error.status,
        details: error
      })
      
      // Supabaseのエラーメッセージを日本語化
      let errorMessage = '登録に失敗しました'
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        errorMessage = 'このメールアドレスは既に登録されています'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '無効なメールアドレスです'
      } else if (error.message.includes('Password should be')) {
        errorMessage = 'パスワードの形式が正しくありません'
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'APIキーの設定に問題があります'
      } else if (error.message.includes('JWT')) {
        errorMessage = '認証トークンの設定に問題があります'
      } else if (error.status === 401) {
        errorMessage = '認証に失敗しました。APIキーを確認してください'
      } else if (error.status === 403) {
        errorMessage = 'アクセス権限がありません'
      } else if (error.status === 404) {
        errorMessage = 'Supabaseプロジェクトが見つかりません'
      }
      
      return {
        message: `${errorMessage} (詳細: ${error.message})`,
        errors: {
          general: [errorMessage]
        }
      }
    }

    if (data.user) {
      // 登録成功
      revalidatePath('/')
      return {
        message: '登録が完了しました！ログインしてサービスをご利用ください。'
      }
    }

    return {
      message: '登録に失敗しました',
      errors: {
        general: ['不明なエラーが発生しました']
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      message: '予期しないエラーが発生しました',
      errors: {
        general: ['システムエラーが発生しました。しばらく時間をおいて再度お試しください。']
      }
    }
  }
}
