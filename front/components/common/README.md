# 共通コンポーネント

このディレクトリには、アプリケーション全体で使用される共通コンポーネントが含まれています。

## コンポーネント一覧

### ToastProvider
- **ファイル**: `ToastProvider.tsx`
- **説明**: react-hot-toastを使用したトースト通知システム
- **使用例**: アプリ全体でラップ（layout.tsxで設定済み）

```typescript
import toast from 'react-hot-toast';

// 成功通知
toast.success('操作が完了しました');

// エラー通知
toast.error('エラーが発生しました');

// ローディング通知
toast.loading('処理中...');
```

### LoadingSpinner
- **ファイル**: `LoadingSpinner.tsx`
- **説明**: 統一されたローディングスピナーコンポーネント
- **Props**:
  - `size`: 'sm' | 'md' | 'lg' - スピナーのサイズ
  - `text`: ローディングメッセージ
  - `fullScreen`: 画面全体に表示するかどうか

```typescript
import { LoadingSpinner } from '@/components/common';

// 基本的な使用
<LoadingSpinner />

// カスタマイズ
<LoadingSpinner size="lg" text="読み込み中..." fullScreen />
```

### ErrorMessage
- **ファイル**: `ErrorMessage.tsx`
- **説明**: 統一されたエラーメッセージ表示コンポーネント
- **Props**:
  - `message`: エラーメッセージ
  - `onClose`: 閉じるボタンのハンドラ（オプション）
  - `showIcon`: アイコンを表示するかどうか

```typescript
import { ErrorMessage } from '@/components/common';

<ErrorMessage message="エラーが発生しました" onClose={() => setError(null)} />
```

### SuccessMessage
- **ファイル**: `SuccessMessage.tsx`
- **説明**: 統一された成功メッセージ表示コンポーネント
- **Props**:
  - `message`: 成功メッセージ
  - `onClose`: 閉じるボタンのハンドラ（オプション）
  - `showIcon`: アイコンを表示するかどうか

```typescript
import { SuccessMessage } from '@/components/common';

<SuccessMessage message="操作が完了しました" />
```

## 最新の改善（2024年1月）

### トースト通知システム導入
- `react-hot-toast`を導入
- アプリ全体で統一された通知UI
- アクセシビリティ対応（ARIA属性）

### リアルタイムバリデーション
- EmailAuthFormとLoginFormに実装
- 入力中に即座にエラー表示
- ユーザーフィードバック向上

### アクセシビリティ改善
- すべての入力フィールドに`aria-label`、`aria-invalid`、`aria-describedby`を追加
- エラーメッセージに`role="alert"`を設定
- スクリーンリーダー対応

