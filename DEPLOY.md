# Vercelへの導入手順

## 1. 自分のプロジェクトを用意する

[Use this template](https://github.com/Kaz1028/gts2026-mandala/generate) から自分のリポジトリを作成し、パソコンにcloneします。[CUSTOMIZE.md](CUSTOMIZE.md) に沿って公開設定とミッションを編集し、次を実行します。

```bash
npm ci
npm run check:config
npm test
npm run setup:credentials
```

作成した自分のリポジトリを、新しいVercelプロジェクトとしてインポートします。元のGTS2026のプロジェクト・DB・写真ストレージは使用しません。独自のGitHubリポジトリを使う場合も、`.env*`、回答レポート、アップロード画像、`.private/` をコミットしないでください。

Node.js 24系のVercel環境を推奨します。リポジトリの `vercel.json` が静的ページとAPIのルーティングを定義しています。ビルドコマンドの追加は不要です。

## 2. DBと写真保存を接続する

- Neonなど、`@vercel/postgres` と互換性のあるPostgres接続を用意し、`POSTGRES_URL` にプール接続URLを設定します。
- 新規DBは現在のVercel Marketplaceから用意できます。旧Vercel PostgresはNeonに移行されています。[Vercelの説明](https://vercel.com/docs/postgres)
- 写真機能にはVercel Blobを接続し、`BLOB_READ_WRITE_TOKEN` を設定します。
- この実装ではBlobの公開アクセスを使用します。写真はURLを知っている人が閲覧できます。
- 利用量・契約プランにより費用が発生するため、各サービスの設定画面で上限を設定してください。無料枠の容量・金額はこの文書では固定値として扱いません。

既存環境との互換性のため `@vercel/postgres` を使用しています。このSDKは非推奨で、新規開発では移行先SDKも検討してください。[公式リポジトリ](https://github.com/vercel/storage)

## 3. 認証情報を設定する

`.env.example` は項目だけのひな形です。実際の値はVercelの環境変数に登録します。ローカル開発では `.env.local` に書き、`npx vercel dev` で起動してください。

| 名前 | 設定内容 |
|---|---|
| `JWT_SECRET` | 32文字以上のランダムな秘密鍵。必須 |
| `ADMIN_ID` | 管理者ID。未指定なら `admin` |
| `ADMIN_PASSWORD` | 16文字以上のランダムな管理者パスワード。必須 |
| `POSTGRES_URL` | DBのプール接続URL。必須 |
| `BLOB_READ_WRITE_TOKEN` | 写真保存用トークン |

上の `npm run setup:credentials` が、秘密鍵と管理者パスワードを生成します。`.private/setup-*/setup.env` の値をVercelへ登録し、DBとBlobの値を補ってください。このファイルはGitの対象外です。公開リポジトリ、Issue、AIチャットへ貼り付けないでください。

チームにパスワードはありません。チームは番号を選ぶだけでログインします。

本番・プレビュー・開発では別のDBと秘密鍵を使用してください。必須の認証設定がなければログインは503を返します。設定後に再デプロイします。

## 4. DBを初期化する

管理者IDとパスワードでログインします。チーム用テーブルがまだなくても、DBが接続できれば管理者はログインできます。ログイン試行制限用のテーブルは自動作成されます。

同じタブの開発者ツールのコンソールで、次を実行してください。

```javascript
const response = await fetch('/api/setup', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + sessionStorage.getItem('gts_token') }
});
console.log(response.status, await response.json());
```

成功時は200と `success: true` が返ります。`event.config.js` の `teamCount` の数だけチームを作成します。既存チームの回答は上書きしません。チーム数を増やした場合は、もう一度実行すると不足分だけ追加されます。

## 5. 利用者へ配布する

運営者は公開URLとチーム番号を参加者へ伝えます。チームはトップページで番号を選ぶだけでログインできます（パスワードは不要）。URLを知っていれば、どのチームの画面にも入れるため、URLは参加者だけに伝えてください。管理者はトップページの管理者欄から、管理者IDとパスワードでログインします。管理者パスワードは配布しないでください。

## 6. 動作確認

1. 未ログイン状態でAPIのデータを取得できないこと。
2. チーム番号を選ぶだけでチームとしてログインでき、管理者は正しいパスワードでのみログインできること。
3. テスト用チームで回答・写真を提出し、管理者画面に反映されること。
4. テスト専用DBでのみ管理者ログインの試行制限、初期化、回答リセットを検証すること。

## 旧版からの移行

旧版からこの版へ切り替えても、提出データはそのまま使えます。チームのパスワードは使わなくなるため、配布し直す必要はありません。作業前にはDBのバックアップを取ってください。

秘密鍵を変更すると既存セッションは無効になり、再ログインが必要です。古い固定認証情報を含むデプロイが引き続きDBに接続できないよう、旧デプロイの停止・削除も必要です。GitHub公開には秘密情報を含む古いGit履歴を持ち込まないでください。
