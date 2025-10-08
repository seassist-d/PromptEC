# API設計概要

本API設計は、提供された要件定義書に基づき、RESTful APIを原則として設計します。  
バックエンドは **Node.js/Express** を想定し、データベースは **PostgreSQL（Supabase対応）** を基盤とします。  
認証は **JWT（Supabase/Auth0連携）** を使用し、ロールベースアクセス制御（RBAC）を適用します。  

- **ロール**:  
  - `user`（出品者/購入者）  
  - `seller`（出品者）  
  - `buyer`（購入者）  
  - `admin`（管理者）  

- **ベースURL**: `https://api.prompt-market.com/v1`  
- **認証**: Bearer Token（JWT）。未認証エンドポイントは公開（例: 検索）。  
- **エラーハンドリング**: 標準HTTPステータスコード（`200 OK`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`）。  
  - レスポンス例: `{ "error": "message", "code": "ERROR_CODE" }`  
- **リクエスト/レスポンス形式**: JSON  
- **タイムスタンプ**: ISO 8601形式  
- **AI SDK統合**: OpenAI / Google AI SDKをバックエンドで使用。プレビュー生成やタグ付けは非同期処理（WebSocketまたはPolling）で実装。  
- **拡張性考慮**: 将来的なサブスク/ランキングは `/subscriptions` や `/rankings` エンドポイントを予約。  

---

## 1. ユーザー管理 (User Management)

ユーザー登録/認証/プロフィール関連。外部認証（Google等）はOAuthフローでSupabase/Auth0経由。

| メソッド | URL              | 説明 | パラメータ/ボディ | レスポンス例 (200 OK) | 認証/権限 |
|----------|------------------|------|-------------------|------------------------|------------|
| POST     | /auth/register   | 新規登録（メール/外部認証） | `{ "email": "user@example.com", "password": "pass", "name": "User", "provider": "email" }` | `{ "userId": "uuid", "token": "jwt", "role": "user" }` | なし |
| POST     | /auth/login      | ログイン | `{ "email": "user@example.com", "password": "pass" }` | `{ "userId": "uuid", "token": "jwt", "role": "user" }` | なし |
| POST     | /auth/logout     | ログアウト（トークン無効化） | - | `{ "message": "Logged out" }` | 必須(user) |
| GET      | /users/profile   | プロフィール取得 | - | `{ "id": "uuid", "name": "User", "avatar": "url", "bio": "desc", "contact": "email", "paymentInfo": { "stripeId": "id" } }` | 必須(user) |
| PUT      | /users/profile   | プロフィール編集 | `{ "name": "NewName", "avatar": "url" }` | `{ "message": "Updated" }` | 必須(user) |
| GET      | /users/{userId}  | 特定ユーザー取得（公開プロフィール） | Path: userId | `{ "id": "uuid", "name": "User", "bio": "desc", "sellerRating": 4.5 }` | なし |

---

## 2. プロンプト出品機能 (Prompt Management)

出品者限定。AI SDKで自動タグ付けオプション。ファイルはS3/Supabase Storageにアップロード。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 (200 OK) | 認証/権限 |
|----------|-----|------|-------------------|------------------------|------------|
| POST     | /prompts | プロンプト登録 | `{ "title": "Prompt Title", "price": 100, "description": "desc", "promptText": "..." }` | `{ "promptId": "uuid", "status": "pending" }` | 必須(seller) |
| GET      | /prompts/{promptId} | プロンプト詳細取得 | Path: promptId | `{ "id": "uuid", "title": "Title", "price": 100, "tags": ["tag1"], "preview": "ai-preview" }` | なし |
| PUT      | /prompts/{promptId} | プロンプト編集 | Path: promptId | `{ "message": "Updated" }` | 必須(seller, own) |
| DELETE   | /prompts/{promptId} | プロンプト削除 | Path: promptId | `{ "message": "Deleted" }` | seller(own) or admin |
| GET      | /prompts/preview/{promptId} | プレビュー生成（AI SDK） | Query: ?model=openai | `{ "previewText": "Generated preview" }` | なし |

---

## 3. プロンプト購入機能 (Purchase Management)

検索は全文検索（PostgreSQL full-text）。カートはセッション/トークン管理。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 | 認証/権限 |
|----------|-----|------|-------------------|--------------|------------|
| GET      | /prompts | プロンプト検索/リスト | `?q=keyword&limit=20&page=1` | `{ "prompts": [...] }` | なし |
| POST     | /cart | カート追加 | `{ "promptId": "uuid", "quantity": 1 }` | `{ "cartId": "uuid", "items": [...] }` | 必須(buyer) |
| GET      | /cart | カート取得 | - | `{ "cartId": "uuid", "items": [...] }` | 必須(buyer) |
| POST     | /orders | 購入手続き（決済開始） | `{ "cartId": "uuid", "paymentMethod": "card" }` | `{ "orderId": "uuid", "status": "pending" }` | 必須(buyer) |
| GET      | /orders | 購入履歴取得 | `?status=completed` | `{ "orders": [...] }` | 必須(buyer) |
| GET      | /orders/{orderId}/download/{promptId} | ダウンロード | Path: orderId, promptId | `{ "downloadUrl": "signed_s3_url" }` | 必須(buyer, own) |

---

## 4. 決済機能 (Payment Management)

Stripe/PayPal/PayPay SDK統合。Webhookで売上更新。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 | 認証/権限 |
|----------|-----|------|-------------------|--------------|------------|
| POST     | /payments/setup | 支払情報登録 | `{ "token": "stripe_token" }` | `{ "customerId": "stripe_id" }` | 必須(user) |
| POST     | /payments/{orderId}/process | 決済実行 | Path: orderId | `{ "status": "succeeded" }` | 必須(user) |
| GET      | /sales | 売上確認（出品者） | `?period=monthly` | `{ "totalSales": 10000, "payouts": [...] }` | 必須(seller) |

---

## 5. レビュー・評価機能 (Review Management)

購入後限定。運営削除可能。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 | 認証/権限 |
|----------|-----|------|-------------------|--------------|------------|
| POST     | /reviews | レビュー投稿 | `{ "promptId": "uuid", "rating": 5, "comment": "Great!" }` | `{ "reviewId": "uuid" }` | 必須(buyer, purchased) |
| GET      | /reviews/{promptId} | レビュー一覧 | Path: promptId | `{ "reviews": [...] }` | なし |
| DELETE   | /reviews/{reviewId} | レビュー削除 | Path: reviewId | `{ "message": "Deleted" }` | admin or author |

---

## 6. 管理者機能 (Admin Management)

管理者限定。AI SDKによる規約違反検知を組み込み。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 | 認証/権限 |
|----------|-----|------|-------------------|--------------|------------|
| GET      | /admin/users | ユーザー一覧 | `?status=active` | `{ "users": [...] }` | 必須(admin) |
| PUT      | /admin/users/{userId}/ban | ユーザー凍結 | `{ "reason": "violation" }` | `{ "message": "Banned" }` | 必須(admin) |
| GET      | /admin/prompts | プロンプト一覧/審査 | `?status=pending` | `{ "prompts": [...] }` | 必須(admin) |
| PUT      | /admin/prompts/{promptId}/approve | プロンプト承認/削除 | `{ "action": "approve" }` | `{ "message": "Approved" }` | 必須(admin) |
| GET      | /admin/reports/sales | 売上レポート | `?sellerId=uuid` | `{ "total": 100000, "breakdown": [...] }` | 必須(admin) |
| GET      | /admin/payments | 決済監視 | `?status=failed` | `{ "payments": [...] }` | 必須(admin) |

---

## 7. AI SDK関連拡張機能 (AI Features - 将来的実装)

OpenAI/Google AI SDKをバックエンドで利用。レコメンドや自動タグ付けを提供。

| メソッド | URL | 説明 | パラメータ/ボディ | レスポンス例 | 認証/権限 |
|----------|-----|------|-------------------|--------------|------------|
| GET      | /ai/recommend | レコメンド提案 | `?userId=uuid&count=5` | `{ "recommendations": [...] }` | 必須(user) |
| POST     | /ai/tag | 自動タグ付け | `{ "promptText": "..." }` | `{ "tags": ["creative"] }` | 必須(seller) |
| GET      | /subscriptions | サブスクプラン（予約） | - | `{ "plans": [...] }` | なし |
| GET      | /rankings | ランキング（予約） | `?category=creative` | `{ "rankings": [...] }` | なし |

---

## 追加考慮事項

- **セキュリティ**: JWT必須、SQLインジェクション/XSS対策、決済情報はトークン化（PCI DSS準拠）  
- **パフォーマンス**: Redisキャッシュ、PM2クラスタリングで同時接続200人対応  
- **多言語**: `lang: "ja|en"` ヘッダー、初期日本語  
- **バックアップ/復旧**: Supabaseの自動バックアップ  
- **テスト/ドキュメント**: OpenAPI 3.0仕様書（Swagger）、ユニット/統合テスト（Jest）推奨  

---
