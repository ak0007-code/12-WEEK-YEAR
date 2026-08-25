# CLAUDE.mdの正本化とAGENTS.mdの整理

## User

ルートフォルダとサブフォルダにそれぞれCLAUDE.mdがあるのはまずい？

## AI

問題ない。Claude Codeの推奨パターンで、ルートのCLAUDE.mdはセッション開始時に、サブフォルダのCLAUDE.mdはそのフォルダのファイルを扱うときに自動で読み込まれる。ただし、各フォルダでCLAUDE.mdとAGENTS.mdがほぼ同内容で重複しており、既に文言がずれ始めている点と、Codexの呼び出し方がルートと4分野の計5箇所に重複している点は改善の余地がある。

## User

CLAUDE.mdを本体にして、AGENTS.mdは同じ階層のCLAUDE.mdを読み込むようにして。Codex呼び出しはルートのCLAUDE.mdだけでいい。

## AI

次のように整理した。

- ルートと4分野のAGENTS.mdを「同じ階層のCLAUDE.mdを正本とし、先に読み込む」という参照だけの内容に置き換えた。
- 4分野のCLAUDE.mdから「Codexの呼び出し方」セクションを削除し、ルートのCLAUDE.mdだけに残した。
- この構成を前提に `scripts/area-structure.test.mjs` と `scripts/english-import.test.mjs` を更新し、全42テストの通過を確認した。

## User

WebページはNext.jsとかで作れない？

## AI

技術的には可能。GitHub Pagesでは静的エクスポート（`output: 'export'`）構成になり、SSRやAPI Routesは使えないが、同期は既にCloudflare Workerに分離されているので実害はない。ただし現状の規模（チェックリスト＋ライブラリの2画面）ではビルド構成の維持コストの方が大きいため、素のJSのままを推奨。画面や機能を本格的に増やす段階になったら、Next.jsよりも軽いVite + React + TypeScriptへの移行を第一候補として提案した。
