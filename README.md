# NISAポートフォリオ管理アプリ

NISAポートフォリオ管理PWAを React + TypeScript で実装中。

## アプリについて

NISA口座の保有銘柄・損益・枠使用状況をスマホでサッと確認できるPWA。

### 主な機能

- 保有銘柄・購入価格・数量の登録・編集・削除
- 評価損益の表示（金額・率）
- NISA枠（成長投資枠 / つみたて投資枠）の使用状況をプログレスバーで表示
- データはブラウザの `localStorage` に保存（サーバー不要）
- PWAとしてホーム画面に追加可能（オフライン対応）

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) 18以上

### インストールと起動

```bash
cd nisa-portfolio
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

### ビルド

```bash
npm run build
npm run preview   # ビルド確認
```

## 技術スタック

| カテゴリ | 使用技術                           |
| -------- | ---------------------------------- |
| UI       | React 18                           |
| 言語     | TypeScript 5                       |
| ビルド   | Vite 5                             |
| PWA      | vite-plugin-pwa (Workbox)          |
| スタイル | Plain CSS（ダークテーマ、CSS変数） |
| 永続化   | localStorage                       |

## プロジェクト構成

```
nisa-portfolio/
├── src/
│   ├── types/          # 型定義
│   ├── utils/          # 計算ユーティリティ
│   ├── hooks/          # カスタムフック
│   ├── components/     # UIコンポーネント
│   ├── App.tsx
│   └── index.css
├── CLAUDE.md           # Claude Code向けプロジェクトガイド
├── vite.config.ts
└── package.json
```
