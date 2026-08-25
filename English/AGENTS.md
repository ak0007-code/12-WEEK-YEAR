# English Coordination

## リポジトリの目的

英語力向上を目標に、日々のアクション・気づき・AIへの相談事項を管理する。

## AIへの指示

- やり取りは基本的に日本語で行う
- フォーマットやディレクトリ構成は運用しながら改善する
- 英語に関する相談を受けたら、質問と回答を `English/details/YYYY-MM-DD-<topic>.md` に都度書き込む（例：`English/details/2026-08-23-phrasal-verbs.md`）
- `English/INSIGHT.md` には、ユーザーが明示的に指示した時だけ、本当に重要な気づきを簡潔に追記する。AIの判断で勝手に書かない。詳細は `English/details/`、INSIGHTは要点のみとする
- このディレクトリは12-WEEK-YEARリポジトリの一部であり、変更は同リポジトリのmainへコミット・pushする

## Codexの呼び出し方

Mac Studio上のcodex-server（`codex exec`のHTTPラッパー）を経由してCodexに相談できる。

- ユーザーが「Codexに壁打ち・相談して」と明示したときに呼び出す。デフォルトは `effort: "medium"` と `fast: true`。ユーザー指定があれば変更する
- 接続情報は環境変数 `CODEX_WEB_SERVER_URL` と `CODEX_WEB_SERVER_SECRECT_KEY` を使用し、値をファイルや会話記録へ残さない
- レスポンスの `sessionId` を次のリクエストへ渡すと同じセッションで会話を継続できる
- `GET /health`（認証不要）で疎通確認できる
