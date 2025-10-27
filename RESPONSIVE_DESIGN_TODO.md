# レスポンシブデザイン対応状況

## 概要
PromptECプロジェクトの全ページをスマホでも見やすいようにレスポンシブデザインに修正する作業。

## 対応済み（部分的に）
1. カート機能（フェーズ5で実装済み）
   - CartList, CartItem, CartSummary
   - モバイル: p-3, フォント調整済み

2. ホームページ（一部対応済み）
   - 基本構造は対応
   - 詳細な調整が必要

3. 認証ページ（login, register）
   - 基本構造は対応
   - padding, font-size の詳細調整が必要

## 対応が必要な主な問題点

### 1. グリッドレイアウト
- md:grid-cols-2, lg:grid-cols-3 の適切な配置
- モバイル時は1列に
- タブレット時は2列に

### 2. サイドバー（検索ページ）
- モバイル: 折りたたみ可能にする
- デスクトップ: 常に表示

### 3. フォントサイズ
- sm:text-2xl, sm:text-3xl の使用
- モバイル: 16px base
- デスクトップ: 18px base

### 4. パディング・マージン
- モバイル: p-4, m-4
- タブレット: sm:p-6, sm:m-6
- デスクトップ: lg:p-8, lg:m-8

### 5. ボタンサイズ
- モバイル: py-2 px-4
- デスクトップ: py-3 px-6

## 対応優先順位

### 優先度: 高
1. 検索ページ（SearchPage.tsx）
   - サイドバーの折りたたみ対応
   - 結果グリッドの調整

2. プロンプト詳細ページ（PromptDetail.tsx）
   - 2カラム → 1カラムに変更
   - ボタンサイズ調整

3. プロフィール編集ページ（ProfileEditForm.tsx）
   - フォーム幅の調整
   - ボタン配置の調整

### 優先度: 中
4. プロンプト作成・編集ページ
   - フォーム幅
   - タブ切り替え

県5. その他ページ
   - FAQ, Privacy, Terms
   - Contact

## ベストプラクティス

### Tailwind CSS ブレークポイント
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

### よく使うパターン
```jsx
// コンテナ
<div className="container mx-auto px-4 sm:px-6 lg:px-8">

// タイトル
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// ボタン
<button className="py-2 px-4 sm:py-3 sm:px-6">

// グリッド
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```
