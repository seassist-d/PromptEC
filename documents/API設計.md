API設計概要
本API設計は、提供された要件定義書に基づき、RESTful APIを原則として設計します。バックエンドはNode.js/Expressを想定し、データベースはPostgreSQL（Supabase対応）を基盤とします。認証はJWT（Supabase/Auth0連携）を使用し、ロールベースアクセス制御（RBAC）を適用：user（出品者/購入者）、seller（出品者）、buyer（購入者）、admin（管理者）。

ベースURL: https://api.prompt-market.com/v1
認証: Bearer Token（JWT）。未認証エンドポイントは公開（例: 検索）。
エラーハンドリング: 標準HTTPステータスコード（200 OK, 401 Unauthorized, 404 Not Found, 500 Internal Server Error）。レスポンスボディに{ "error": "message", "code": "ERROR_CODE" }を返す。
リクエスト/レスポンス形式: JSON。タイムスタンプはISO 8601形式。
AI SDK統合: OpenAI/Google AI SDKをバックエンドで使用。プレビュー生成やタグ付けは非同期処理（WebSocketまたはPolling）で実装。
拡張性考慮: 将来的なサブスク/ランキングは/subscriptionsや/rankingsエンドポイントを予約。

以下に、主要エンドポイントをカテゴリ別にまとめます。各エンドポイントの詳細として、HTTPメソッド、URL、パス、クエリ/ボディパラメータ、レスポンス例を記述します。
1. ユーザー管理 (User Management)
ユーザー登録/認証/プロフィール関連。外部認証（Google等）はOAuthフローでSupabase/Auth0経由。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限POST/auth/register新規登録（メール/外部認証）Body: `{ "email": "user@example.com", "password": "pass", "name": "User", "provider": "emailgooglemicrosoftPOST/auth/loginログインBody: `{ "email": "user@example.com", "password": "pass", "provider": "email..." }`{ "userId": "uuid", "token": "jwt", "role": "user" }POST/auth/logoutログアウト（トークン無効化）-{ "message": "Logged out" }必須 (user)GET/users/profileプロフィール取得-{ "id": "uuid", "name": "User", "avatar": "url", "bio": "desc", "contact": "email", "paymentInfo": { "stripeId": "id" } }必須 (user)PUT/users/profileプロフィール編集Body: { "name": "NewName", "avatar": "url", "bio": "new desc", "contact": "new email", "paymentInfo": { "stripeId": "id" } }{ "message": "Updated" }必須 (user)GET/users/{userId}特定ユーザー取得（公開プロフィール）Path: userId (uuid){ "id": "uuid", "name": "User", "bio": "desc", "sellerRating": 4.5 }なし
2. プロンプト出品機能 (Prompt Management)
出品者限定。プロンプト登録時はAI SDKで自動タグ付け（オプション）。ファイルはS3/Supabase Storageにアップロード。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限POST/promptsプロンプト登録Body: { "title": "Prompt Title", "category": "creative", "tags": ["tag1"], "price": 100, "description": "desc", "thumbnail": "url", "promptText": "prompt content", "outputExample": "sample output" } (multipart/form-data for file){ "promptId": "uuid", "status": "pending" }必須 (seller)GET/prompts/{promptId}プロンプト詳細取得Path: promptId (uuid){ "id": "uuid", "title": "Title", "price": 100, "description": "desc", "tags": ["tag1"], "thumbnail": "url", "outputExample": "sample", "preview": "ai-generated-preview" (AI SDK使用), "sellerId": "uuid" }なしPUT/prompts/{promptId}プロンプト編集Path: promptId; Body: 上記登録と同様{ "message": "Updated" }必須 (seller, own prompt)DELETE/prompts/{promptId}プロンプト削除Path: promptId{ "message": "Deleted" }必須 (seller, own prompt or admin)GET/prompts/preview/{promptId}プレビュー生成（保留→AI SDK実装）Path: promptId; Query: ?model=openai{ "previewText": "Generated preview (first 100 chars)" }なし (非同期)
3. プロンプト購入機能 (Purchase Management)
検索は全文検索（PostgreSQL full-text）。カートはセッション/トークン管理。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限GET/promptsプロンプト検索/リストQuery: `?q=keyword&category=creative&priceMin=0&priceMax=500&sort=popularpricenew&limit=20&page=1`POST/cartカート追加Body: { "promptId": "uuid", "quantity": 1 }{ "cartId": "uuid", "items": [{ "promptId": "uuid", "price": 100 }] }必須 (buyer)GET/cartカート取得-上記と同様必須 (buyer)POST/orders購入手続き（決済開始）Body: `{ "cartId": "uuid", "paymentMethod": "cardpaypalpaypay" }`GET/orders購入履歴取得Query: ?status=completed&limit=10&page=1{ "orders": [{ "id": "uuid", "promptId": "uuid", "total": 100, "downloadUrl": "url" (無制限DL) }] }必須 (buyer)GET/orders/{orderId}/download/{promptId}ダウンロードPath: orderId, promptId{ "downloadUrl": "signed_s3_url" }必須 (buyer, own order)
4. 決済機能 (Payment Management)
Stripe/PayPal/PayPay SDK統合。還元は80%（手数料運営負担）。Webhookで売上更新。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限POST/payments/setup支払情報登録（Stripe Customer作成）Body: { "token": "stripe_token", "method": "card" }{ "customerId": "stripe_id" }必須 (user)POST/payments/{orderId}/process決済実行Path: orderId; Body: `{ "paymentMethod": "cardpaypalpaypay" }`GET/sales売上確認（出品者）Query: ?period=monthly&start=2025-01-01&end=2025-10-03{ "totalSales": 10000, "payouts": [{ "amount": 8000, "fee": 300 }] }必須 (seller)
5. レビュー・評価機能 (Review Management)
購入後限定。運営削除可能。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限POST/reviewsレビュー投稿Body: { "promptId": "uuid", "rating": 5, "comment": "Great!" }{ "reviewId": "uuid" }必須 (buyer, purchased)GET/reviews/{promptId}レビュー一覧Path: promptId; Query: ?limit=10{ "reviews": [{ "id": "uuid", "rating": 5, "comment": "Great!", "userId": "uuid" }] }なしDELETE/reviews/{reviewId}レビュー削除Path: reviewId{ "message": "Deleted" }必須 (admin or author)
6. 管理者機能 (Admin Management)
管理者限定。出力例チェックはAI SDKで自動（規約違反検知）。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限GET/admin/usersユーザー一覧/管理Query: ?status=active&limit=50{ "users": [{ "id": "uuid", "email": "email", "role": "user", "status": "active" }] }必須 (admin)PUT/admin/users/{userId}/banユーザー凍結/BANPath: userId; Body: { "reason": "violation" }{ "message": "Banned" }必須 (admin)GET/admin/promptsプロンプト一覧/審査Query: ?status=pending&category=creative`{ "prompts": [{ "id": "uuid", "title": "Title", "status": "approvedrejected", "violationCheck": "ai_result" }] }`PUT/admin/prompts/{promptId}/approveプロンプト承認/削除Path: promptId; Body: `{ "action": "approverejectdelete", "reason": "ok" }`GET/admin/reports/sales売上レポートQuery: ?sellerId=uuid&period=monthly&start=2025-01-01{ "total": 100000, "breakdown": [{ "sellerId": "uuid", "amount": 80000 }] }必須 (admin)GET/admin/payments決済監視Query: ?status=failed&date=2025-10-03{ "payments": [{ "id": "id", "status": "succeeded", "amount": 100 }] }必須 (admin)
7. AI SDK関連拡張機能 (AI Features - 将来的実装)
AI SDK（OpenAI/Google）をバックエンドで呼び出し。レコメンドは閲覧/購入履歴に基づく類似性計算。

メソッドURL説明パラメータ/ボディレスポンス例 (200 OK)認証/権限GET/ai/recommendレコメンド提案Query: ?userId=uuid&count=5 (履歴自動取得){ "recommendations": [{ "promptId": "uuid", "score": 0.9, "reason": "ai_generated" }] }必須 (user)POST/ai/tag自動タグ付け（登録時オプション）Body: { "promptText": "content" }{ "tags": ["creative", "business"] }必須 (seller)GET/subscriptionsサブスクプラン（予約）-{ "plans": [{ "id": "uuid", "name": "Unlimited", "price": 1000 }] }なしGET/rankingsランキング（予約）Query: ?category=creative&period=weekly{ "rankings": [{ "promptId": "uuid", "rank": 1, "sales": 100 }] }なし
追加考慮事項

セキュリティ: すべての機密エンドポイントにJWT必須。入力サニタイズ（SQLインジェクション/XSS対策）。決済情報はトークン化（PCI DSS準拠）。
パフォーマンス: キャッシュ（Redis）で検索/リストを最適化。同時接続200人対応のため、PM2クラスタリング。
多言語: レスポンスにlang: "ja|en"ヘッダー。初期日本語。
バックアップ/復旧: Supabaseの自動バックアップ活用。
テスト/ドキュメント: OpenAPI 3.0仕様書生成（Swagger）。ユニット/インテグレーションテスト（Jest）推奨。

この設計は要件をカバーし、拡張性を確保しています。実装時の詳細調整が必要な場合、追加情報をいただければ洗練します。