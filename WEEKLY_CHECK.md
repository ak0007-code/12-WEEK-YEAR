# Weekly Check

NotionのWeek 1〜8を移植した、1週間1 Issue方式です。曜日を親として折りたたみ、その中に各エリアの項目チェックを表示します。

## データ

- 対象期間：2026-06-29〜2026-08-23
- アクション：各週13〜17項目
- 正本：`plans/week-01.json`〜`plans/week-08.json`
- 元データ：[Notion「12 Week Year」](https://app.notion.com/p/12-Week-Year-431fae8ed035825db4e88195ae977d29)

`completedDays`にはNotionでチェックされていた曜日を日付へ変換して保存しています。Weekごとに項目や目標回数が変わった場合も、その週の内容を保持します。

## ローカルでプレビューする

Notionの実績を反映したIssue本文（Week 8の例）：

```bash
node scripts/weekly-check.mjs \
  --plan plans/week-08.json
```

すべて未チェックのIssue本文：

```bash
node scripts/weekly-check.mjs \
  --plan plans/week-08.json \
  --blank
```

## GitHubでIssueを作る

1. GitHubの「Actions」を開く。
2. 「Create Weekly Check Issue」を選ぶ。
3. 「Run workflow」を押す。
4. 作成するWeekを選ぶ。
5. Notionの実績を入れる場合は `prefill_completed` を有効にする。スマホ操作を試す場合は無効にする。

同じWeekのIssueがすでに存在するときは、新しいIssueを重複作成しません。

Week 1〜8は終了済みの履歴です。今後のWeekを開始するときに、対象プランとスケジュール実行を追加します。

## テスト

```bash
node --test scripts/weekly-check.test.mjs
```
