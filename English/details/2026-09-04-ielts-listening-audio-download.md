# IELTS Online Tests のリスニング音声DL検証

## User

https://ieltsonlinetests.com/ielts-exam-library?skill=listening のリスニング問題の音声はたぶんYouTubeから来ているが、英語の勉強のために音声をDLしたい。2025 January Test 1 で試してみてほしい。

## AI

リモート環境からは検証できなかった。理由と、手元のMacで試す手順を残す。

### 結果

- 対象ページは `https://ieltsonlinetests.com/ielts-mock-test-2025-january-listening-practice-test-1`（Web検索で特定）。
- このリモート環境のネットワークポリシーで `ieltsonlinetests.com`、`youtube.com`、`web.archive.org` へのアクセスがすべて拒否され（proxy 403）、ページのHTMLも音声URLも取得できなかった。`yt-dlp` も未インストール。
- そのため「音声がYouTube由来か」「DL可能か」はこの環境では未確認。

### 手元のMacで確認する手順

1. Chromeで上記ページを開き、DevTools（⌘⌥I）→ Network タブ → フィルタを「Media」にする。
2. 再生ボタンを押す。`.mp3` / `.m4a` / `.m3u8` などのリクエストが出たら、右クリック → Copy → Copy link address。
   - ドメインが `ieltsonlinetests.com` や CDN（cloudfront など）なら、そのURLを `curl -L -o test1.mp3 "<URL>"` で保存できる可能性が高い（Referer が必要なら `-H "Referer: https://ieltsonlinetests.com/"` を追加）。
   - `youtube.com` / `googlevideo.com` へのリクエストなら YouTube 埋め込み。Elements タブで `iframe` の `src` から動画IDを取り、`yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=<ID>"` で音声だけ取れる（`brew install yt-dlp ffmpeg`）。
3. どちらでも取れなければ、ページの `<audio>` 要素を Elements タブで探し、`src` を直接開く。

### 留意点

- 個人の学習用途に限り、再配布はしない。
- 取得できたURLの形式が分かれば、他のテスト（2025 January Test 2〜）にも同じ手順を横展開できる。
