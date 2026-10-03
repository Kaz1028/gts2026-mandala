# マンダラチャート Webシステム

チームでミッションに取り組み、記述回答・写真・達成状況を共有するWebアプリです。GTS2026のシンガポール研修向けに作成した内容を、他のイベントでも利用・改変できる形で公開しています。

A team-based mandala mission board with text/photo submissions, progress tracking, and an organizer dashboard. Japanese UI; deploy your own instance on Vercel.

## できること

- 22チームのログインと、テーマ別のミッション一覧
- 記述回答、写真提出、チェック式の達成記録
- 得点・ランク・達成演出
- 管理者による進捗確認、特典管理、提出内容の確認

## 使い始める

このリポジトリは**アプリのソースコード**です。運営中のイベントの参加者データ、写真、ログイン情報は含みません。自分のVercelプロジェクト・データベース・写真ストレージを用意して利用してください。GitHub PagesだけではAPIやDBは動きません。

1. このリポジトリをForkまたはcloneします。
2. Node.js 20以上（デプロイは24系推奨）で `npm ci` を実行します。
3. [DEPLOY.md](DEPLOY.md) に沿ってVercel、Postgres、Blob、認証情報を設定します。
4. 管理者としてDBを初期化し、各チームへ個別にログイン情報を配布します。

```bash
npm ci
npm test
npx vercel dev
```

ローカル開発にも専用のDBと環境変数が必要です。本番DBを開発・プレビューと共有しないでください。Vercel CLIは `npx vercel` で利用できます。

## イベント内容を変える

ミッション、配点、テーマ名は [api/lib/mandalaData.js](api/lib/mandalaData.js)、画面の表示は `index.html`・`team.html`・`admin.html` を編集します。チーム番号は現在1〜22固定です。増やす場合はログイン画面・設定検証・管理APIの上限を揃えて変更してください。

コードの公開は、GTS2026やJCIなどの名称・商標について権利を付与するものではありません。自分のイベントに合わせて名称や内容を調整してください。

## 認証とデータ

- 秘密鍵・管理者パスワードはサーバーの環境変数で管理します。
- チームパスワードはscryptハッシュで保存します。旧版の平文パスワードは使用できません。
- ログイン失敗はアカウントごとに15分間で10回まで。制限情報はDBで共有します。
- 管理者向けDB初期化は、認証付きPOSTのみ受け付けます。
- **写真は公開Blobに保存され、写真URLを知っている人は閲覧できます。** 非公開画像保管機能ではありません。個人情報や機密写真を扱う用途には、認証付きの画像配信へ変更してください。
- 詳しくは [SECURITY.md](SECURITY.md) を参照してください。

## テスト

`npm test` は秘密情報や外部サービスを使わず、認証、JWT、パスワードハッシュ、ログイン試行制限、入力画面の処理を検証します。実際のDB・Blobとの接続は、デプロイした環境で別途確認してください。

## ライセンスと協力

アプリ独自のコードは [MIT License](LICENSE) です。絵文字など外部素材の条件は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を確認してください。

不具合はIssueへ、改善はPull Requestで受け付けます。パスワード・参加者情報を添付しないでください。[CONTRIBUTING.md](CONTRIBUTING.md) もご覧ください。
