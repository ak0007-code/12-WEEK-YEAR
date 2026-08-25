# English Coordination

## リポジトリの目的

英語力向上を目標に、日々のアクション・気づき・AIへの相談事項を管理する個人リポジトリ。

## AIへの指示

- やり取りは基本的に日本語で行う
- フォーマットやディレクトリ構成はこれから運用しながら作っていく
- 英語に関する相談を受けたら、質問と回答を `English/details/YYYY-MM-DD-<topic>.md` に都度書き込む（例：`English/details/2026-08-23-phrasal-verbs.md`）
- `English/INSIGHT.md` には、ユーザーが明示的に指示した時だけ、本当に重要な気づきを簡潔に追記する。AIの判断で勝手に書かない。詳細は `English/details/`、INSIGHTは要点のみとする
- このディレクトリは12-WEEK-YEARリポジトリの一部であり、変更は同リポジトリのmainへコミット・pushする

## Codex の呼び出し方

Mac Studio 上の codex-server(`codex exec` の HTTP ラッパー)を経由して Codex に相談できる。

- ユーザーが「Codex に壁打ち・相談して」と言ったら呼び出す。デフォルトは `effort: "medium"` + `fast: true`。ユーザーが指定したら `xhigh` などに変更する
- 接続情報は環境変数 `CODEX_WEB_SERVER_URL` と `CODEX_WEB_SERVER_SECRECT_KEY` にある(URL はトンネル再起動で変わることがある)

```bash
curl -sS -X POST "$CODEX_WEB_SERVER_URL/run" \
  -H "Authorization: Bearer $CODEX_WEB_SERVER_SECRECT_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"<相談内容>","effort":"medium","fast":true}'
```

- レスポンスの `sessionId` を次のリクエストに `"sessionId": "<id>"` として渡すと同じセッションで会話を継続できる
- `GET /health`(認証不要)で疎通確認できる
