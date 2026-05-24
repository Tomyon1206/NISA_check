# CLAUDE.md — NISAポートフォリオ

## プロジェクト概要
NISA口座の保有銘柄・損益・枠使用状況を管理するスマホ対応PWA。
React 18 + TypeScript + Vite + vite-plugin-pwa で構成。

## ディレクトリ構成
```
src/
  types/index.ts          # 型定義（Holding, NisaType, NISA_LIMITS）
  utils/calculations.ts   # 損益・サマリー・NISA枠の計算関数
  hooks/useHoldings.ts    # 銘柄CRUD + localStorage永続化
  components/
    HoldingForm.tsx       # 銘柄追加／編集フォーム
    HoldingCard.tsx       # 銘柄1件のカード表示
    Summary.tsx           # ポートフォリオ合計サマリー
    NisaGauge.tsx         # NISA枠プログレスバー
  App.tsx                 # ルートコンポーネント・状態管理
  index.css               # ダークテーマCSS（CSS変数ベース）
```

## 開発コマンド
```bash
npm install     # 初回セットアップ
npm run dev     # 開発サーバー起動（http://localhost:5173）
npm run build   # 本番ビルド（dist/）
npm run preview # ビルド後の動作確認
npm run lint    # ESLintチェック
```

## NISA枠ルール（2024年〜）
| 枠 | 年間上限 | 定数名 |
|---|---|---|
| 成長投資枠 | 240万円 | `NISA_LIMITS.growth` |
| つみたて投資枠 | 120万円 | `NISA_LIMITS.tsumitate` |
| 合計 | 360万円 | `NISA_LIMITS.total` |

枠の計算は `calcNisaUsage(holdings, year)` で行い、**購入日の年**を基準にフィルタリングする。

## データ永続化
- `localStorage` の `nisa-portfolio-holdings` キーに JSON 保存
- `useHoldings` フックが読み書きを担当
- 外部API連携なし（現在値は手動入力）

## スタイリング方針
- CSS変数（`:root`）でダークテーマを一元管理
- モバイルファースト：モーダルはボトムシート、デスクトップは中央寄せ
- クラス命名はBEM風フラット（`holding-card`, `price-row` 等）
- Tailwind等のフレームワークは使用しない

## コーディング規約
- コンポーネントは名前付きエクスポート（`export function Foo`）
- `useState`の初期値に`loadFromStorage`を渡すパターン（不要な再実行を防ぐ）
- 数値フォーマットは`utils/calculations.ts`の`formatCurrency`/`formatPercent`を使う
- コメントは「なぜ」が自明でない箇所にのみ記述
