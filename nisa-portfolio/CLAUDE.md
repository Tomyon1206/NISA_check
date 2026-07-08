# CLAUDE.md — NISAポートフォリオ

## プロジェクト概要
NISA口座の保有銘柄・損益・枠使用状況を管理するスマホ対応PWA。
React 18 + TypeScript + Vite + vite-plugin-pwa で構成。

## ディレクトリ構成
```
src/
  types/index.ts          # 型定義（Holding, NisaType, NISA_LIMITS）
  utils/calculations.ts   # 損益・サマリー・NISA枠の計算関数
  utils/holdingsIO.ts     # インポートJSONのバリデーション
  utils/priceApi.ts       # /api/price（現在値取得）, /api/stockSearch（銘柄検索）のラッパー
  hooks/useHoldings.ts    # 銘柄CRUD + localStorage永続化
  components/
    HoldingForm.tsx       # 銘柄追加フォーム（銘柄名/ティッカーで検索・選択→数量（口）等入力、NISA枠超過を警告）
    HoldingCard.tsx       # 銘柄1件のカード表示（現在値更新は一括更新ボタンに統合済み）
    DataActions.tsx       # 保有銘柄データのJSON書き出し/読み込み
    Summary.tsx           # ポートフォリオ合計サマリー
    NisaGauge.tsx         # NISA枠プログレスバー（上限超過時はエラー表示）
  App.tsx                 # ルートコンポーネント・状態管理・全銘柄の現在値一括更新
  index.css               # ダークテーマCSS（CSS変数ベース）
api/price.ts               # Vercel Serverless Function（Yahoo Financeの現在値を代理取得しCORSを回避）
api/stockSearch.ts         # Vercel Serverless Function（Yahoo Financeの銘柄検索を代理取得）
docs/stock-api-research.md # 株価API調査メモ
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

## 銘柄検索・選択
- `HoldingForm`では銘柄名/ティッカーを自由入力する代わりに、`/api/stockSearch?q=...`（Yahoo Finance検索を代理取得）で候補を検索し、一覧から選択する方式にしている
- 選択した銘柄の`symbol`/`name`がそのまま`Holding.ticker`/`Holding.name`として保存される
- 銘柄未選択の状態では数量等の入力欄・追加ボタンを表示しない（選択後にのみ表示）

## 現在値の自動取得・一括更新
- `HoldingForm`での銘柄追加時に`/api/price?ticker=...`（Vercel Serverless Function）を呼び出して現在値を自動取得する
- 保有銘柄一覧の「全銘柄の現在値を更新」ボタン（`App.tsx`の`handleRefreshAll`）で、保有中の全銘柄をまとめて再取得する。銘柄カード個別の更新ボタンは廃止し、この一括更新に統合した
- サーバーレス関数はYahoo Financeのエンドポイントをサーバー側で叩くことでブラウザ側のCORS制約を回避している（詳細はdocs/stock-api-research.md）
- 取得に失敗した場合は購入単価を仮の現在値として設定する（追加時）か、その銘柄だけ更新をスキップする（一括更新時）。いずれも結果件数をメッセージで表示する

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
