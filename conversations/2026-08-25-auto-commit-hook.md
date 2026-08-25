# details/・conversations/ の自動コミット設定(2026-08-25)

## User

details/ や conversations/ を変更した時は常に自動でcommit・pushするようにしたい。hooksを設定したら良いか？

## AI

hooksが正解。「ファイル変更のたびに自動で何かを実行する」はAIの記憶や指示では実現できず、Claude Codeのharnessが実行するhookが必要。

設定内容：`.claude/settings.json`（プロジェクト設定、リポジトリにコミット）に PostToolUse hook を追加。

- 発火条件: Write/Editツールの成功後、対象ファイルのパスが `*/details/*.md` または `*/conversations/*.md` にマッチした時
- 動作: そのファイルを `git add` → `Auto-commit: <ファイル名>` でコミット → `git push origin HEAD`（現在のブランチをプッシュ）
- 変更がない場合はコミットが失敗して静かに終了する（エラーにしない）

注意点：

- hookは現在チェックアウト中のブランチにプッシュする。リモートセッションでは作業ブランチに押されるため、mainへの反映（マージ）は従来通り必要
- このセッション自体には設定が読み込まれないため、有効になるのは次回セッション以降
