# DcPen ✏️

**[XRift](https://xrift.net/) 用の空間らくがきペン** — VRChat の [QvPen](https://booth.pm/ja/items/1555789) の操作体系を、XRift のワールドとアイテムの両方に持ち込んだものです。

*A QvPen-style spatial drawing pen for XRift worlds & items.*

> このForkは原作者 [toming](https://github.com/tomingtoming/dcpen) さんのMIT版を土台に、
> 「お絵描き保存ワールド」でブラシとマルチプレイ描画を検証するための特化実験版です。既定の描画は従来どおりLINEです。

![DcPen](public/thumbnail.png)

## できること

- 鉛筆型の **14色＋虹ペン** が空中のラックに並ぶ（虹ペンの線は虹色グラデーション）
- **VR**: 左右どちらの手でもグリップ（握る）で掴む。**両手に1本ずつ持てる**。掴んだ瞬間の持ち方のまま手に追従（縦持ち・横持ち自由）。グリップを離すと**その場の空中に浮いて留まる**
- 持ち手のトリガーで描く。**トリガー2連打（0.2秒）で LINE → RIBBON → FUDE → 消しゴムを循環**。消しゴムはペン先が球になり、触れた部分だけ削れる**部分消し**（線は残りに分割。本家に無い拡張）
- **消しゴム×3**: 掴んでトリガーで線に当てると、その線が1本消える（本家準拠）
- ペンごとの **Respawn / Clear（自分の同ペン線を消去）** ボタン、左パネルに **Undo / Clear Mine / All Reset**
- 線・持ち主・浮遊位置はインスタンス内で**全員に同期**。late joiner にも復元
- **デスクトップ**: クリックで持つ／戻す・左ボタン長押しで描く
- 描いた線はインスタンスが生きている限り残る＝**書き置き**ができる
- `enableBrushControls` で、選択した物理ペンごとに **LINE / RIBBON / FUDE** と太さを独立設定
- RIBBONはコントローラー姿勢と描画速度を帯メッシュへ反映。FUDEはさらに入り・抜きのテーパーを加える
- 遅く動かすと太く、速く動かすと細くなる。ライブ幅メーターと1ストロークの最小・最大値を表示
- **ALL / MINE / PEN** で表示を切替。Undo・消しゴム・Clearは操作した本人の線だけに作用
- ストロークへ物理ペン番号・作者ID・表示名を保持し、ブラシ情報とともに同期・late join復元

## ワールドに置く

```bash
npm install xrift-dcpen
```

```tsx
import { DcPen } from 'xrift-dcpen'

export const World = () => (
  <>
    {/* 任意の位置・向きに置ける。複数置くなら syncId を変える */}
    <DcPen position={[0, 0, -3]} rotationY={Math.PI / 4} />
    <DcPen position={[3, 0, -3]} enableBrushControls defaultBrush="ribbon" />
  </>
)
```

| prop | 既定 | 説明 |
| --- | --- | --- |
| `position` | `[0, 0, 0]` | 設置位置（ラックの足元） |
| `rotationY` | `0` | Y回転。ラック正面は +Z |
| `syncId` | `'dcpen'` | 同期キーの名前空間。複数設置時は一意にする |
| `enableBrushControls` | `false` | LINE/RIBBON/FUDEと太さ比較UIを表示 |
| `defaultBrush` | `'line'` | 初期ブラシ（`line` / `ribbon`） |
| `defaultRibbonSize` | `0.035` | RIBBONの基準幅（m） |
| `onSelectedPenChange` | - | ラックまたは空中のペンを選択・取得した時に物理ペン番号を通知 |

依存（`react` / `three` / `@react-three/fiber` / `@react-three/drei` / `@react-three/rapier` / `@xrift/world-components`）はすべて peerDependencies です。XRift ワールドプロジェクトなら追加インストールは不要です。

## アイテム版

このリポジトリは XRift アイテムとしてもビルドされます（`npm run build` → `xrift upload item`）。アイテム版はインベントリからどのワールドにも設置できます。

## 名前の由来

特にありません。

## クレジット

- 操作体系は [QvPen](https://github.com/ureishi/QvPen)（ureishi さん）へのリスペクト実装です。コードは React Three Fiber でゼロから書いており、本家（UdonSharp）からの流用はありません
- 参考: [HQ・LQ切り替えスイッチ付ミラー](https://booth.pm/ja/items/3640350) ほか VRChat のワールドギミック文化

## 開発

```bash
npm install
npm run dev        # devプレビュー (https, ?preview で設置プレビュー確認)
npm run build      # XRiftアイテムのビルド (Module Federation)
npm run build:lib  # npmライブラリのビルド (lib/)
npm test           # ブラシ形状・作者/ペン情報・旧イベント互換のテスト
```

## License

[MIT](LICENSE)
