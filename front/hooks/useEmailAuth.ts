'use client';

import { useState } from 'react';
import { supabase, clearAuthState } from '@/lib/supabaseClient';

interface UseEmailAuthReturn {
  signUp: (email: string, password: string, source: 'register' | 'login') => Promise<{ success: boolean; error?: string; isExistingUser?: boolean }>;
  resendEmail: (email: string, source: 'register' | 'login') => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function useEmailAuth(): UseEmailAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUp = async (
    email: string,
    password: string,
    _source: 'register' | 'login'
  ): Promise<{ success: boolean; error?: string; isExistingUser?: boolean }> => {
    setIsLoading(true);
    setErrors({});

    try {
      // まず既存ユーザーかチェック（ログインを試みる）
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        // ログインが成功した場合（既存ユーザー）
        if (loginData.user && !loginError) {
          console.log('既存ユーザーが検出されました。ログインします...');
          
          // セッションが設定されたので、成功として返す（isExistingUserフラグ付き）
          return { success: true, isExistingUser: true };
        }

        // ログインエラーの場合
        if (loginError) {
          console.log('ログインエラー:', loginError);
          
          // Invalid credentialsエラーの場合、OAuthで登録済みの可能性
          if (loginError.message?.includes('Invalid login credentials')) {
            console.log('Invalid credentialsエラー - OAuthユーザーの可能性をチェック');
            
            // OAuthユーザーをチェック
            try {
              const checkResponse = await fetch('/api/auth/check-oauth-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              
              if (checkResponse.ok) {
                const checkResult = await checkResponse.json();
                console.log('OAuthチェック結果:', checkResult);
                
                if (checkResult.isOAuthUser && checkResult.provider) {
                  const providerName = checkResult.provider === 'google' ? 'Google' : checkResult.provider === 'azure' ? 'Microsoft' : 'OAuth';
                  return {
                    success: false,
                    error: `このメールアドレスは${providerName}で既に登録されています。`
                  };
                }
              }
            } catch (oauthCheckError) {
              console.error('OAuthチェックエラー:', oauthCheckError);
            }
            
            // OAuthユーザーが検出されなかった場合、新規ユーザーとして扱う（signUpを続行）
            console.log('OAuthユーザーが検出されませんでした。新規登録を続行します。');
          }
        }
      } catch (_checkError: unknown) {
        // ログイン失敗は想定内（新規ユーザーまたはパスワード間違い）
        console.log('既存ユーザーではない、またはパスワードが一致しません');
      }


      // メール認証の場合、クリアは不要（新しいユーザーの登録なので）
      // 念のため、エラーが発生しても続行するようにtry-catchで囲む
      try {
        await clearAuthState();
      } catch (clearError) {
        console.log('認証状態クリアをスキップ:', clearError);
        // クリアに失敗しても続行
      }

      // Supabaseで新規登録を試行
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback/email`
        }
      });

      console.log('signUp result:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        email_confirmed_at: data?.user?.email_confirmed_at,
        confirmation_sent_at: data?.user?.confirmation_sent_at,
        app_metadata: data?.user?.app_metadata,
        identities: data?.user?.identities
      });

      if (error) {
        console.error('メール認証エラー:', error);
        console.error('エラーメッセージ詳細:', error.message);
        console.error('エラーコード:', error.code);
        
        // OAuthプロバイダーで登録されている場合の判定
        const errorMsg = error.message.toLowerCase();
        const isOAuthUser = 
          errorMsg.includes('oauth') ||
          errorMsg.includes('google') ||
          errorMsg.includes('microsoft') ||
          errorMsg.includes('azure') ||
          errorMsg.includes('different provider') ||
          errorMsg.includes('different login method') ||
          errorMsg.includes('account provider') ||
          error.code === 'oauth_provider' ||
          error.code === 'signup_disabled';

        if (isOAuthUser) {
          return {
            success: false,
            error: 'このメールアドレスはGoogleかMicrosoftで登録済みです。'
          };
        }
        
        // エラーメッセージの判定
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already registered') ||
          error.message.includes('Email address already registered') ||
          error.message.includes('duplicate key value') ||
          error.message.includes('email already exists') ||
          error.message.includes('For security purposes, you can only request this after') ||
          error.status === 429
        ) {
          return {
            success: false,
            error: 'このメールアドレスは既に登録済みです。ログイン画面からログインしてください。'
          };
        } else if (error.message.includes('Password should be at least')) {
          return {
            success: false,
            error: 'パスワードは6文字以上で入力してください。'
          };
        } else if (error.message.includes('Invalid email')) {
          return {
            success: false,
            error: '正しいメールアドレスを入力してください。'
          };
        } else {
          return {
            success: false,
            error: '新規登録に失敗しました'
          };
        }
      }

      // 成功
      if (data?.user) {
        console.log('ユーザー情報詳細:', {
          email_confirmed_at: data.user.email_confirmed_at,
          identities: data.user.identities,
          app_metadata: data.user.app_metadata,
          user_id: data.user.id
        });
        
        // Google/Microsoftで登録済みかどうかをapp_metadataから判定
        const appMetadata = data.user.app_metadata || {};
        const providers = appMetadata.providers || [];
        console.log('登録済みプロバイダー:', providers);
        
        // email以外のプロバイダーで登録済みの場合
        if (providers.length > 0 && providers.some((p: string) => p !== 'email')) {
          const oauthProvider = providers.find((p: string) => p !== 'email');
          const providerName = oauthProvider === 'google' ? 'Google' : oauthProvider === 'azure' ? 'Microsoft' : 'OAuth';
          
          // 作成したばかりのユーザーを削除
          try {
            await fetch('/api/auth/delete-temp-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.user.id })
            });
          } catch (deleteError) {
            console.error('ユーザー削除エラー:', deleteError);
          }
          
          return {
            success: false,
            error: `このメールアドレスは${providerName}で既に登録されています。`
          };
        }
        
        // ユーザー作成後に、同じメールアドレスで他の認証プロバイダーに登録済みユーザーがいるかチェック
        try {
          const response = await fetch('/api/auth/check-oauth-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('OAuth ユーザーチェック結果:', result);
            console.log('チェック対象メールアドレス:', email);
            
            if (result.isOAuthUser && result.provider) {
              const providerName = result.provider === 'google' ? 'Google' : result.provider === 'azure' ? 'Microsoft' : 'OAuth';
              console.log('OAuthユーザーが検出されました:', providerName);
              
              // 作成したばかりのユーザーを削除するAPIを呼び出す
              const deleteResponse = await fetch('/api/auth/delete-temp-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.user.id })
              });
              console.log('一時ユーザー削除結果:', deleteResponse.ok);
              
              return {
                success: false,
                error: `このメールアドレスは${providerName}で登録済みです。`
              };
            } else {
              console.log('OAuthユーザーは検出されませんでした。APIのレスポンス:', result);
            }
          } else {
            console.error('APIレスポンスエラー:', response.status, response.statusText);
          }
        } catch (checkError) {
          console.error('ユーザーチェックエラー:', checkError);
          // エラーが発生しても処理を続行
        }
        
        // メールが送信されたかチェック
        const confirmationSentAt = data.user.confirmation_sent_at;
        console.log('メール送信状況:', confirmationSentAt);
        
        // メール送信されていない場合（既存ユーザーの可能性）
        if (!confirmationSentAt && !data.user.email_confirmed_at) {
          console.log('メールが送信されませんでした。既存ユーザーの可能性があります。');
          
          // APIでOAuthユーザーを再チェック
          try {
            const checkResponse = await fetch('/api/auth/check-oauth-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            
            if (checkResponse.ok) {
              const checkResult = await checkResponse.json();
              
              if (checkResult.isOAuthUser && checkResult.provider) {
                const providerName = checkResult.provider === 'google' ? 'Google' : checkResult.provider === 'azure' ? 'Microsoft' : 'OAuth';
                
                // 作成したばかりのユーザーを削除
                await fetch('/api/auth/delete-temp-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: data.user.id })
                });
                
                return {
                  success: false,
                  error: `このメールアドレスは${providerName}で既に登録されています。`
                };
              }
            }
          } catch (finalCheckError) {
            console.error('最終チェックエラー:', finalCheckError);
          }
          
          return {
            success: false,
            error: 'このメールアドレスは既に登録済みです。ログイン画面からログインしてください。'
          };
        }
        
        // メールが既に確認されている場合（既存ユーザー）はエラーとして扱う
        if (data.user.email_confirmed_at) {
          console.log('既存ユーザーが新規登録を試みました');
          
          // 認証プロバイダーをチェック
          const identities = data.user.identities || [];
          const hasOAuthProvider = identities.some(
            (identity: { id: string; provider: string }) => identity.provider !== 'email'
          );
          
          if (hasOAuthProvider) {
            const oauthProvider = identities.find((identity: { id: string; provider: string }) => identity.provider !== 'email')?.provider;
            const providerName = oauthProvider === 'google' ? 'Google' : oauthProvider === 'azure' ? 'Microsoft' : 'OAuth';
            return {
              success: false,
              error: `このメールアドレスは${providerName}で登録済みです。`
            };
          }
          
          return {
            success: false,
            error: 'このメールアドレスは既に登録済みです。ログイン画面からログインしてください。'
          };
        }
        
        return { success: true };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('メール認証で予期しないエラー:', error);
      return {
        success: false,
        error: '新規登録に失敗しました'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async (
    email: string,
    _source: 'register' | 'login'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback/email`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message 
        ? error.message 
        : '再送に失敗しました。時間をおいてお試しください。';
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    resendEmail,
    isLoading,
    errors,
    setErrors
  };
}

