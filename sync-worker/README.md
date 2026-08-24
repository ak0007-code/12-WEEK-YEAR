# README自動同期Worker

GitHub Pagesのチェック結果を、`plans/week-XX.json` とREADMEの「今週のアクション」へ同じコミットで同期するCloudflare Workerです。

## 現在の構成

- Pages: `https://ak0007-code.github.io/12-WEEK-YEAR/`
- Worker: `https://12-week-year-sync.asahi0107wave-094.workers.dev`
- OAuth callback: `https://12-week-year-sync.asahi0107wave-094.workers.dev/auth/callback`
- KV binding: `OAUTH_SESSIONS`

Workerを更新するときは、このディレクトリでデプロイします。OAuth AppのClient secretはリポジトリに置かず、Cloudflareの暗号化されたsecretとして管理します。

GitHubのアクセストークンはKVに保存され、ブラウザにはランダムなセッションIDだけを渡します。同期できるGitHubアカウントとリポジトリはWorkerの環境変数で固定します。
