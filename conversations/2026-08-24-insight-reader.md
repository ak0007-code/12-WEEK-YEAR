# Insightリーダー

## User

WebサイトのNotesの横にInsightボタンを置き、`English/`、`Health/`、`Work/`、`Humanity/` のInsightを簡単に確認できるようにしたい。

## AI

Notesと同じダイアログを使うInsightリーダーを追加した。4分野の `INSIGHT.md` をGitHub Pagesへ配置し、分野を選んで閲覧できる。タイトルしかないInsightには、まだ内容がないことを表示する。

## User

NotesとInsightをモーダルではなく新規ページまたは全画面で読みたい。また、Markdownの `**太字**` がアスタリスクのまま表示されている。

## AI

モーダルを廃止し、NotesとInsightを専用の全画面ページで開く構成へ変更した。Markdownの太字記法を解析し、Web上ではアスタリスクを表示せず太字要素として描画するようにした。
