# サロンボード - スタッフ共有版

スタッフごとにログインして売上を管理。オーナーは全スタッフの売上を一覧できます。

---

## デプロイ手順

### 1. GitHubにアップロード
1. https://github.com でアカウント作成（無料）
2. 「New repository」→ 名前: `salon-board` → Create
3. このフォルダの中身を全部アップロード

### 2. Vercelにデプロイ
1. https://vercel.com でGitHubアカウントでログイン
2. 「Add New Project」→ `salon-board` を選択 → Deploy
3. デプロイ完了後URLが発行される（例: salon-board.vercel.app）

### 3. Vercel KVを設定
1. VercelのプロジェクトページでStorageタブ
2. 「Create Database」→「KV」→ 名前: `salon-kv` → Create
3. 「Connect to Project」でプロジェクトに紐付け

### 4. 環境変数を設定
Vercelのプロジェクト → Settings → Environment Variables に追加:

| 変数名 | 値（例） |
|--------|---------|
| JWT_SECRET | 長くてランダムな文字列（例: my-salon-secret-2024-xyz） |
| SETUP_SECRET | セットアップ用パスワード（例: setup-pass-abc） |

追加後、Vercelで「Redeploy」を実行。

### 5. ユーザーを登録（初回のみ）
以下のcurlコマンドをターミナルで実行（またはPostmanなどで）:

```
curl -X POST https://あなたのURL.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "setup-pass-abc",
    "users": [
      { "username": "owner", "password": "オーナーのパスワード", "displayName": "オーナー", "role": "owner" },
      { "username": "yuki", "password": "ゆきのパスワード", "displayName": "ゆき", "role": "staff" },
      { "username": "hana", "password": "はなのパスワード", "displayName": "はな", "role": "staff" }
    ]
  }'
```

### 6. ホーム画面に追加
- iPhone: Safariでアクセス → 共有ボタン →「ホーム画面に追加」
- Android: Chromeでアクセス → メニュー →「ホーム画面に追加」

---

## ログイン情報の管理
- ユーザー追加は `/api/setup` に同じリクエストを送ればOK
- パスワード変更も同じAPIで再送すれば上書きされます
