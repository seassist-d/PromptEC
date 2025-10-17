-- =============================================
-- シードデータ（初期データ）（修正版 - 既存のデータを安全に削除してから再作成）
-- =============================================

-- 既存のシードデータを安全に削除
DELETE FROM public.subscription_plans WHERE name IN ('ベーシック', 'プロ', 'エンタープライズ', 'ベーシック年額', 'プロ年額');
DELETE FROM public.tags WHERE slug IN ('ai', 'chatgpt', 'gpt4', 'claude', 'gemini', 'productivity', 'automation', 'templates', 'japanese', 'english', 'beginner', 'advanced', 'business', 'creative', 'technical', 'marketing', 'sales', 'customer_service', 'hr', 'finance', 'legal', 'healthcare', 'education', 'research', 'analysis', 'reporting', 'presentation', 'meeting', 'email', 'social_media', 'content_creation', 'seo', 'copywriting', 'translation', 'proofreading', 'editing', 'summarization', 'brainstorming', 'planning', 'strategy', 'optimization', 'troubleshooting', 'debugging', 'testing', 'documentation', 'tutorial', 'guide', 'tips', 'best_practices', 'case_study', 'examples', 'samples');
DELETE FROM public.categories WHERE slug IN ('blog_writing', 'technical_writing', 'copywriting', 'javascript', 'python', 'web_development', 'ui_design', 'graphic_design', 'web_design', 'writing', 'coding', 'design', 'business', 'education', 'creative', 'analysis', 'communication', 'productivity', 'other');
DELETE FROM public.payment_providers WHERE code IN ('card', 'paypal', 'paypay', 'bank_transfer');

-- 決済プロバイダーの初期データ
INSERT INTO public.payment_providers (code, display_name, fee_percent, meta) VALUES
('card', 'クレジットカード', 3.6, '{"provider": "stripe", "supported_countries": ["JP", "US", "GB"]}'),
('paypal', 'PayPal', 4.0, '{"provider": "paypal", "supported_countries": ["JP", "US", "GB", "DE"]}'),
('paypay', 'PayPay', 3.0, '{"provider": "paypay", "supported_countries": ["JP"]}'),
('bank_transfer', '銀行振込', 0.0, '{"provider": "manual", "supported_countries": ["JP"]}');

-- カテゴリの初期データ
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
('writing', 'ライティング', '文章作成・執筆に関するプロンプト', 1),
('coding', 'プログラミング', 'コード生成・プログラミング支援に関するプロンプト', 2),
('design', 'デザイン', 'デザイン・クリエイティブに関するプロンプト', 3),
('business', 'ビジネス', 'ビジネス・マーケティングに関するプロンプト', 4),
('education', '教育', '学習・教育に関するプロンプト', 5),
('creative', 'クリエイティブ', '創作・アートに関するプロンプト', 6),
('analysis', '分析', 'データ分析・調査に関するプロンプト', 7),
('communication', 'コミュニケーション', 'コミュニケーション・対話に関するプロンプト', 8),
('productivity', '生産性', '効率化・生産性向上に関するプロンプト', 9),
('other', 'その他', 'その他のカテゴリ', 10);

-- サブカテゴリの追加
INSERT INTO public.categories (slug, name, description, parent_id, sort_order) VALUES
('blog_writing', 'ブログ執筆', 'ブログ記事の執筆支援', (SELECT id FROM public.categories WHERE slug = 'writing'), 1),
('technical_writing', '技術文書', '技術文書・マニュアルの作成', (SELECT id FROM public.categories WHERE slug = 'writing'), 2),
('copywriting', 'コピーライティング', '広告・マーケティング文書の作成', (SELECT id FROM public.categories WHERE slug = 'writing'), 3),
('javascript', 'JavaScript', 'JavaScript関連のプログラミング', (SELECT id FROM public.categories WHERE slug = 'coding'), 1),
('python', 'Python', 'Python関連のプログラミング', (SELECT id FROM public.categories WHERE slug = 'coding'), 2),
('web_development', 'Web開発', 'Webサイト・アプリケーション開発', (SELECT id FROM public.categories WHERE slug = 'coding'), 3),
('ui_design', 'UIデザイン', 'ユーザーインターフェースデザイン', (SELECT id FROM public.categories WHERE slug = 'design'), 1),
('graphic_design', 'グラフィックデザイン', 'ロゴ・バナー・イラストデザイン', (SELECT id FROM public.categories WHERE slug = 'design'), 2),
('web_design', 'Webデザイン', 'Webサイトデザイン', (SELECT id FROM public.categories WHERE slug = 'design'), 3);

-- タグの初期データ
INSERT INTO public.tags (slug, name) VALUES
('ai', 'AI'),
('chatgpt', 'ChatGPT'),
('gpt4', 'GPT-4'),
('claude', 'Claude'),
('gemini', 'Gemini'),
('productivity', '生産性'),
('automation', '自動化'),
('templates', 'テンプレート'),
('japanese', '日本語'),
('english', '英語'),
('beginner', '初心者向け'),
('advanced', '上級者向け'),
('business', 'ビジネス'),
('creative', 'クリエイティブ'),
('technical', '技術的'),
('marketing', 'マーケティング'),
('sales', '営業'),
('customer_service', 'カスタマーサービス'),
('hr', '人事'),
('finance', '財務'),
('legal', '法務'),
('healthcare', '医療'),
('education', '教育'),
('research', '研究'),
('analysis', '分析'),
('reporting', 'レポート'),
('presentation', 'プレゼンテーション'),
('meeting', '会議'),
('email', 'メール'),
('social_media', 'SNS'),
('content_creation', 'コンテンツ作成'),
('seo', 'SEO'),
('copywriting', 'コピーライティング'),
('translation', '翻訳'),
('proofreading', '校正'),
('editing', '編集'),
('summarization', '要約'),
('brainstorming', 'ブレインストーミング'),
('planning', '計画'),
('strategy', '戦略'),
('optimization', '最適化'),
('troubleshooting', 'トラブルシューティング'),
('debugging', 'デバッグ'),
('testing', 'テスト'),
('documentation', 'ドキュメント'),
('tutorial', 'チュートリアル'),
('guide', 'ガイド'),
('tips', 'Tips'),
('best_practices', 'ベストプラクティス'),
('case_study', 'ケーススタディ'),
('examples', '例'),
('samples', 'サンプル');

-- サブスクリプションプランの初期データ（将来機能）
INSERT INTO public.subscription_plans (name, price_jpy, period, benefits, status) VALUES
('ベーシック', 980, 'monthly', '{"max_prompts_per_month": 10, "priority_support": false, "advanced_analytics": false}', 'active'),
('プロ', 2980, 'monthly', '{"max_prompts_per_month": 50, "priority_support": true, "advanced_analytics": true}', 'active'),
('エンタープライズ', 9800, 'monthly', '{"max_prompts_per_month": -1, "priority_support": true, "advanced_analytics": true, "custom_integration": true}', 'active'),
('ベーシック年額', 9800, 'yearly', '{"max_prompts_per_month": 10, "priority_support": false, "advanced_analytics": false, "discount_percent": 17}', 'active'),
('プロ年額', 29800, 'yearly', '{"max_prompts_per_month": 50, "priority_support": true, "advanced_analytics": true, "discount_percent": 17}', 'active');

-- サンプルユーザープロフィール（テスト用）
-- 注意: 実際の運用では、auth.usersテーブルにユーザーが作成された後に実行する必要があります
-- INSERT INTO public.user_profiles (user_id, display_name, role) VALUES
-- ('00000000-0000-0000-0000-000000000001', '管理者', 'admin'),
-- ('00000000-0000-0000-0000-000000000002', 'テスト出品者', 'seller'),
-- ('00000000-0000-0000-0000-000000000003', 'テスト購入者', 'user');

-- サンプルプロンプト（テスト用）
-- 注意: 実際のユーザーが作成された後に実行する必要があります
-- INSERT INTO public.prompts (seller_id, title, slug, category_id, price_jpy, short_description, long_description, status, visibility) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'ブログ記事作成プロンプト', 'blog-writing-prompt', (SELECT id FROM public.categories WHERE slug = 'blog_writing'), 500, '効果的なブログ記事を自動生成するプロンプト', 'このプロンプトを使用することで、SEOを意識した魅力的なブログ記事を自動生成できます。キーワード、ターゲット読者、記事の長さなどを指定することで、最適化されたコンテンツを作成できます。', 'published', 'public'),
-- ('00000000-0000-0000-0000-000000000002', 'JavaScriptコード生成プロンプト', 'javascript-code-generator', (SELECT id FROM public.categories WHERE slug = 'javascript'), 800, 'JavaScriptのコードを効率的に生成するプロンプト', 'このプロンプトは、JavaScriptのコード生成を支援します。関数、クラス、非同期処理、エラーハンドリングなど、様々なパターンのコードを生成できます。ベストプラクティスに従った、読みやすく保守しやすいコードを出力します。', 'published', 'public'),
-- ('00000000-0000-0000-0000-000000000002', 'UIデザイン改善プロンプト', 'ui-design-improvement', (SELECT id FROM public.categories WHERE slug = 'ui_design'), 1200, 'ユーザーインターフェースの改善提案を生成するプロンプト', 'このプロンプトは、既存のUIデザインを分析し、ユーザビリティとアクセシビリティの観点から改善提案を生成します。デザインの課題を特定し、具体的な改善案と実装方法を提案します。', 'published', 'public');

-- プロンプトタグの関連付け（サンプル）
-- INSERT INTO public.prompt_tags (prompt_id, tag_id) VALUES
-- ((SELECT id FROM public.prompts WHERE slug = 'blog-writing-prompt'), (SELECT id FROM public.tags WHERE slug = 'ai')),
-- ((SELECT id FROM public.prompts WHERE slug = 'blog-writing-prompt'), (SELECT id FROM public.tags WHERE slug = 'chatgpt')),
-- ((SELECT id FROM public.prompts WHERE slug = 'blog-writing-prompt'), (SELECT id FROM public.tags WHERE slug = 'productivity')),
-- ((SELECT id FROM public.prompts WHERE slug = 'javascript-code-generator'), (SELECT id FROM public.tags WHERE slug = 'coding')),
-- ((SELECT id FROM public.prompts WHERE slug = 'javascript-code-generator'), (SELECT id FROM public.tags WHERE slug = 'javascript')),
-- ((SELECT id FROM public.prompts WHERE slug = 'ui-design-improvement'), (SELECT id FROM public.tags WHERE slug = 'design')),
-- ((SELECT id FROM public.prompts WHERE slug = 'ui-design-improvement'), (SELECT id FROM public.tags WHERE slug = 'ui_design'));

-- プロンプトバージョンの作成（サンプル）
-- INSERT INTO public.prompt_versions (prompt_id, version, title_snapshot, description_snapshot, content_type) VALUES
-- ((SELECT id FROM public.prompts WHERE slug = 'blog-writing-prompt'), 1, 'ブログ記事作成プロンプト', '効果的なブログ記事を自動生成するプロンプト', 'text'),
-- ((SELECT id FROM public.prompts WHERE slug = 'javascript-code-generator'), 1, 'JavaScriptコード生成プロンプト', 'JavaScriptのコードを効率的に生成するプロンプト', 'text'),
-- ((SELECT id FROM public.prompts WHERE slug = 'ui-design-improvement'), 1, 'UIデザイン改善プロンプト', 'ユーザーインターフェースの改善提案を生成するプロンプト', 'text');

-- プロンプトアセットの作成（サンプル）
-- INSERT INTO public.prompt_assets (prompt_version_id, kind, text_content, size_bytes) VALUES
-- ((SELECT pv.id FROM public.prompt_versions pv JOIN public.prompts p ON pv.prompt_id = p.id WHERE p.slug = 'blog-writing-prompt' AND pv.version = 1), 'text_body', 'あなたは経験豊富なブログライターです。以下の情報を基に、魅力的でSEOを意識したブログ記事を作成してください。

-- 【記事の要件】
-- - タイトル: {title}
-- - キーワード: {keywords}
-- - ターゲット読者: {target_audience}
-- - 記事の長さ: {word_count}文字程度
-- - トーン: {tone}

-- 【記事構成】
-- 1. 魅力的なタイトルとメタディスクリプション
-- 2. 導入部（読者の関心を引く）
-- 3. 本文（3-5セクション）
-- 4. 結論（行動を促すCTA）
-- 5. 関連キーワードの自然な配置

-- 【注意点】
-- - SEOを意識した見出し構造
-- - 読みやすさを重視
-- - 具体的な例やデータを含める
-- - 読者の悩みを解決する内容

-- 上記の要件に従って、ブログ記事を作成してください。', 1500),
-- ((SELECT pv.id FROM public.prompt_versions pv JOIN public.prompts p ON pv.prompt_id = p.id WHERE p.slug = 'javascript-code-generator' AND pv.version = 1), 'text_body', 'あなたは上級JavaScript開発者です。以下の要件に基づいて、高品質なJavaScriptコードを生成してください。

-- 【要件】
-- - 機能: {functionality}
-- - パターン: {pattern}
-- - エラーハンドリング: {error_handling}
-- - パフォーマンス: {performance_requirements}
-- - ブラウザサポート: {browser_support}

-- 【コード生成ガイドライン】
-- 1. ES6+の機能を活用
-- 2. 適切なコメントとJSDoc
-- 3. エラーハンドリングの実装
-- 4. パフォーマンスを考慮した実装
-- 5. テストしやすい構造
-- 6. セキュリティを意識した実装

-- 【出力形式】
-- - 完全なコード
-- - 使用例
-- - 注意点
-- - テスト方法

-- 上記の要件に従って、JavaScriptコードを生成してください。', 2000),
-- ((SELECT pv.id FROM public.prompt_versions pv JOIN public.prompts p ON pv.prompt_id = p.id WHERE p.slug = 'ui-design-improvement' AND pv.version = 1), 'text_body', 'あなたはUX/UIデザインの専門家です。提供されたUIデザインを分析し、改善提案を生成してください。

-- 【分析対象】
-- - デザイン画像: {design_image}
-- - 用途: {purpose}
-- - ターゲットユーザー: {target_users}
-- - プラットフォーム: {platform}

-- 【分析観点】
-- 1. ユーザビリティ
-- 2. アクセシビリティ
-- 3. 視覚的階層
-- 4. 色彩設計
-- 5. タイポグラフィ
-- 6. レイアウト
-- 7. インタラクション

-- 【改善提案の構成】
-- 1. 現状分析
-- 2. 課題の特定
-- 3. 改善案の提示
-- 4. 実装方法
-- 5. 優先度の設定
-- 6. 期待される効果

-- 【出力形式】
-- - 詳細な分析レポート
-- - 具体的な改善案
-- - 実装の優先順位
-- - 参考デザインの提案

-- 上記の観点から、UIデザインの改善提案を生成してください。', 2500);
