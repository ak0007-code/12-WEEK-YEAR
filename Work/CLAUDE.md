# Work Coordination

## 目的

Ampliumに必要な機能を揃え、AI研究を前進させるための計画と実行記録を管理する。

## AIへの指示

- やり取りは基本的に日本語で行う
- 仕事に関する相談は `Work/details/YYYY-MM-DD-<topic>.md` に記録する
- 一般的な会話や複数分野にまたがる会話は、ルートの `conversations/YYYY-MM-DD-<topic>.md` に記録する
- 複数分野にまたがる会話から仕事部分を残す場合は、会話全体を `conversations/` に置き、仕事部分の要点だけを `Work/details/` に記録する
- `Work/INSIGHT.md` には、ユーザーが明示的に指示したときだけ重要な気づきを簡潔に追記する。AIの判断では追記しない
- パスワード、APIトークン、Cookieなどの秘密情報は記録しない
- 変更は12-WEEK-YEARリポジトリのmainへコミット・pushする

## Codex の呼び出し方

Mac Studio 上の codex-server（`codex exec` の HTTP ラッパー）を経由して Codex に相談できる。

- ユーザーが「Codex に壁打ち・相談して」と言ったら呼び出す。デフォルトは `effort: "medium"` + `fast: true`。ユーザーが指定したら `xhigh` などに変更する
- 接続情報は環境変数 `CODEX_WEB_SERVER_URL` と `CODEX_WEB_SERVER_SECRECT_KEY` にある（URLはトンネル再起動で変わることがある）

```bash
curl -sS -X POST "$CODEX_WEB_SERVER_URL/run" \
  -H "Authorization: Bearer $CODEX_WEB_SERVER_SECRECT_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"<相談内容>","effort":"medium","fast":true}'
```

- レスポンスの `sessionId` を次のリクエストに `"sessionId": "<id>"` として渡すと同じセッションで会話を継続できる
- `GET /health`（認証不要）で疎通確認できる
