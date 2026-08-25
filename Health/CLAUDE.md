# Health Coordination

## 目的

睡眠、休息、運動、食事、美容、心身の状態を改善し、その計画と実行記録を管理する。

## AIへの指示

- やり取りは基本的に日本語で行う
- 健康に関する相談は `Health/details/YYYY-MM-DD-<topic>.md` に記録する
- 一般的な会話や複数分野にまたがる会話は、ルートの `conversations/YYYY-MM-DD-<topic>.md` に記録する
- 複数分野にまたがる会話から健康部分を残す場合は、会話全体を `conversations/` に置き、健康部分の要点だけを `Health/details/` に記録する
- `Health/INSIGHT.md` には、ユーザーが明示的に指示したときだけ重要な気づきを簡潔に追記する。AIの判断では追記しない
- 秘密情報や、記録する必要のないセンシティブな個人情報は残さない
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
