# 社内RAGシステム (Dify × Next.js)

Dify APIを活用した社内向けRAGシステムです。
ナレッジをアップロードし、チャット画面で社内情報に基づいた回答を得られます。

## 技術スタック

- Next.js 16.2.4 (App Router)
- TypeScript
- Tailwind CSS
- Dify API (cloud.dify.ai)

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd rag
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定してください。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```env
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_APP_API_KEY=app-your-app-api-key-here
DIFY_KNOWLEDGE_API_KEY=dataset-your-knowledge-api-key-here
DIFY_DATASET_ID=your-dataset-id-here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## 使い方

### チャット画面 (`/`)
- 入力欄にメッセージを入力して送信すると、Difyのナレッジに基づいた回答が得られます
- ストリーミング形式で逐次表示されます
- 会話履歴は同一セッション内で保持されます

### ナレッジ管理画面 (`/upload`)
- ドキュメントファイルをアップロードしてナレッジを追加できます
- アップロード済みドキュメントの一覧表示・削除が可能です

## 環境変数

| 変数名 | 説明 |
|---|---|
| `DIFY_API_BASE_URL` | Dify APIのベースURL（通常 `https://api.dify.ai/v1`） |
| `DIFY_APP_API_KEY` | DifyアプリのAPIキー（`app-` で始まる） |
| `DIFY_KNOWLEDGE_API_KEY` | DifyナレッジAPIキー（`dataset-` で始まる） |
| `DIFY_DATASET_ID` | 使用するデータセットのID |

> **注意**: APIキーは `.env.local` で管理し、絶対にコミットしないでください。

## セキュリティ

- Dify APIキーはサーバー側（API Routes）でのみ使用します
- クライアントサイドにAPIキーは露出しません
- `.env.local` は `.gitignore` により除外済みです
