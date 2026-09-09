## User

GitHub Pagesのチェックリストで、Week 11のチェックを押してもREADMEと同期されない。

## AI

原因は `plans/week-11.json` の `status` が `"upcoming"` のままだったこと。Week 10を `completed` にしたときにWeek 11を `active` に切り替えていなかった。

- フロント（docs/app.js）は `status === "active"` の週しか同期をスケジュールせず、ボタンも「計画前」で無効になる
- Worker（sync-worker/worker.mjs）も `active` 以外の週の同期を拒否する

対応：

- `plans/week-11.json` の `status` を `"active"` に変更
- READMEの「今週のアクション」をWorkerと同じ描画ロジックで再生成し、初回同期で表の整形差分が出ないようにした
- Week 10〜12の状態とREADMEの表を検証するテストを現状に合わせて更新し、activeな週がちょうど1つであることを確認するテストを追加

今後、週を切り替えるときは前週を `completed`、新しい週を `active` にする。
