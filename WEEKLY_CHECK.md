# Weekly Check

NotionのWeek 1を使った、1週間1 Issue方式の試作です。曜日を親として折りたたみ、その中に各エリアの項目チェックを表示します。

## データ

- 対象期間：2026-06-29〜2026-07-05
- アクション：17項目
- 正本：[plans/week-01.json](plans/week-01.json)
- 元データ：[Notion「12 Week Year」](https://app.notion.com/p/12-Week-Year-431fae8ed035825db4e88195ae977d29)

`completedDays`にはNotionでチェックされていた曜日を日付へ変換して保存しています。

## ローカルでプレビューする

NotionのWeek 1実績を反映したIssue本文：

```bash
node scripts/weekly-check.mjs \
  --plan plans/week-01.json
```

すべて未チェックのIssue本文：

```bash
node scripts/weekly-check.mjs \
  --plan plans/week-01.json \
  --blank
```

## GitHubでIssueを作る

1. GitHubの「Actions」を開く。
2. 「Create Weekly Check Issue」を選ぶ。
3. 「Run workflow」を押す。
4. Notionの実績を入れる場合は `prefill_completed` を有効にする。スマホ操作を試す場合は無効にする。

同じWeekのIssueがすでに存在するときは、新しいIssueを重複作成しません。

Week 1は終了済みのため、毎朝の自動実行はまだ設定していません。今後のWeekを開始するときに、対象プランとスケジュール実行を追加します。

## テスト

```bash
node --test scripts/weekly-check.test.mjs
```
