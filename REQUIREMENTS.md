# Dify RAG × Next.js プロジェクト要件定義

## プロジェクト概要
Dify APIを活用した社内向けRAGシステム。
ユーザーはナレッジをアップロードでき、チャット画面で社内情報に基づいた回答を得られる。

## 技術スタック
- Next.js 16.2.4 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Dify API (cloud.dify.ai)

## 機能要件
### Phase 1: 基本チャット機能
- Dify Chatflow APIを使った対話UI
- ストリーミング対応（逐次表示）
- 会話履歴の保持（conversation_id管理）

### Phase 2: ナレッジ管理
- ドキュメントアップロード画面
- アップロード済みドキュメント一覧
- ドキュメント削除機能

### Phase 3: 運用機能（後回し）
- ユーザー認証
- 利用ログ
- コスト可視化

## セキュリティ要件
- Dify APIキーは必ずサーバー側（API Routes）で扱う
- クライアントにAPIキーを露出させない
- .env.localで環境変数管理、.gitignoreに追加

## ディレクトリ構成
src/
├── app/
│   ├── page.tsx                 # チャット画面
│   ├── upload/page.tsx          # アップロード画面
│   └── api/
│       ├── chat/route.ts        # Dify Chat API中継
│       ├── upload/route.ts      # ドキュメントアップロード中継
│       └── documents/route.ts   # ドキュメント一覧取得
├── lib/
│   └── dify.ts                  # Dify APIクライアント
└── components/
    ├── ChatInterface.tsx
    └── UploadForm.tsx

## 環境変数
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_APP_API_KEY=app-xxxxx
DIFY_KNOWLEDGE_API_KEY=dataset-xxxxx
DIFY_DATASET_ID=xxxxx
