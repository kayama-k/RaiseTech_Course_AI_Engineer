# task_management
Task Management Project

## Task Board (トレロ風タスク管理アプリ)

デスクトップのブラウザで使う、Trello風のタスク管理Webアプリです。

詳細な要件は [docs/requirements.md](docs/requirements.md) を参照してください。

### 機能
- リスト(列)の作成・リネーム・削除
- カードの作成・編集・削除
- カードへの予定日時(いつやるか)の任意設定(タスクごとにON/OFF可能。予定日時を過ぎている・24時間以内は色分け表示)
- ドラッグ&ドロップでカードをリスト内・リスト間で移動
- 背景のカスタマイズ(プリセットカラー、またはローカル画像のアップロード。ウィンドウサイズに追従してフィット表示)

### 技術構成
| 層 | 技術 |
|---|---|
| フロントエンド | React + Vite、ドラッグ&ドロップは [@dnd-kit](https://dndkit.com/) |
| バックエンド | Node.js + Express |
| DB | SQLite(Node.js組み込みの `node:sqlite`。追加インストール不要) |

`node:sqlite` を使うため **Node.js 22.5 以上**が必要です(Node 24系で動作確認済み)。

### セットアップと起動

ターミナルを2つ開いて、それぞれで以下を実行してください。

```bash
# 1. バックエンド (http://localhost:3001)
cd task_management/backend
npm install
npm run dev

# 2. フロントエンド (http://localhost:5173)
cd task_management/frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開くとボードが表示されます。

### データの保存先
- タスクデータ: `backend/data/app.db`(SQLite。初回起動時に自動作成、`To Do` / `In Progress` / `Done` の3リストを初期データとして投入)
- 背景設定(色・画像): ブラウザのローカルストレージ(サーバー側DBには保存されません)

### ディレクトリ構成
```
task_management/
├── docs/
│   └── requirements.md  # 要件定義書
├── backend/            # Express API サーバー
│   ├── server.js
│   ├── db.js           # SQLiteスキーマ定義・初期シード
│   ├── routes/
│   │   ├── lists.js
│   │   └── cards.js
│   └── data/app.db      # SQLiteデータファイル(gitignore対象)
└── frontend/           # React (Vite) アプリ
    └── src/
        ├── App.jsx      # 状態管理・ドラッグ&ドロップ制御
        ├── api.js       # バックエンドAPIクライアント
        └── components/
            ├── Board.jsx
            ├── List.jsx
            ├── Card.jsx
            ├── AddListForm.jsx
            ├── AddCardForm.jsx
            ├── CardModal.jsx
            └── BackgroundPicker.jsx
```
