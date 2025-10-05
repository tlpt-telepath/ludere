# Sanity 初期設定メモ

以下はこのリポジトリを Sanity と連携させるための初期設定手順です。

## 1. 必要な環境
- Node.js 18 以上
- npm 9 以上 (Node に付属)
- Sanity アカウント (https://www.sanity.io/)

## 2. Sanity Studio の作成
1. 任意の場所で Sanity Studio 用ディレクトリを作成します。
   ```bash
   mkdir sanity-studio
   cd sanity-studio
   ```
2. Sanity Studio を初期化します。
   ```bash
   npm create sanity@latest -- --template clean
   ```
   - Prompts: プロジェクト名、データセット名 (例: `production`)、出力ディレクトリなどを入力します。
   - 既存の Sanity プロジェクトを使う場合は既存の projectId を指定、新規の場合は Wizard に従って作成します。
3. 初期化後、以下のコマンドで Studio を起動して確認できます。
   ```bash
   npm install
   npm run dev
   ```

## 3. スキーマの追加
`sanity-studio/schemas` 以下に下記ファイルを追加してください。

### `schemas/work.js`
```js
export default {
  name: 'work',
  title: 'Works',
  type: 'document',
  fields: [
    { name: 'title', title: 'タイトル', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'summary', title: '概要', type: 'text', rows: 3 },
    {
      name: 'mainImage',
      title: 'メインビジュアル',
      type: 'image',
      options: { hotspot: true },
    },
    { name: 'url', title: 'リンク (任意)', type: 'url' },
    {
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
      options: { dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm' },
    },
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', date: 'publishedAt' },
    prepare({ title, media, date }) {
      return { title, media, subtitle: date ? new Date(date).toLocaleDateString() : '' };
    },
  },
};
```

### `schemas/post.js`
```js
export default {
  name: 'post',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    { name: 'title', title: 'タイトル', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'summary', title: '概要', type: 'text', rows: 4 },
    {
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
      options: { dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm' },
    },
    {
      name: 'url',
      title: '外部リンク (任意)',
      type: 'url',
    },
    {
      name: 'body',
      title: '本文',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'summary' },
  },
};
```

### `schemas/index.js`
生成された `schemaTypes` に上記スキーマを登録します。
```js
import post from './post';
import work from './work';

export const schemaTypes = [work, post];
```

## 4. CORS/トークン設定
1. Sanity プロジェクト設定 (manage.sanity.io) で API > CORS origins を開き、ローカル開発時は `http://localhost:5000` など必要なオリジンを追加します。(静的ホスティング先が決まっている場合はそのドメインも追加)
2. `Public` dataset のみを読み込む場合はトークン不要。ドラフトや非公開データを読む場合は「Tokens」で `Viewer` 権限の API Token を作成し、`.env` などに保持してください。

## 5. フロント側の設定
1. `script/sanity-config.example.js` を `script/sanity-config.js` にコピーします。
   ```bash
   cp script/sanity-config.example.js script/sanity-config.js
   ```
2. `script/sanity-config.js` に以下を設定します。
   ```js
   window.SANITY_PROJECT_ID = 'yourProjectId';
   window.SANITY_DATASET = 'production'; // 選択した dataset
   window.SANITY_API_VERSION = '2024-05-01';
   window.SANITY_USE_CDN = true; // draft を表示したい場合は false
   // window.SANITY_READ_TOKEN = 'sanityViewerToken';
   ```
3. ブラウザで `works.html` と `blog.html` を開き、Sanity に登録したデータが表示されるか確認します。
   - Blog の各カードをクリックすると `post.html?slug=...` に遷移し、本文が表示されます。記事本文を公開する際は必ず slug を設定してください。

## 6. デプロイメモ
- 静的ホスティングの場合、Sanity からのデータ取得はクライアントフェッチなので追加のビルド工程は不要です。
- セキュリティのため、トークンを露出させたくない場合は Netlify/Vercel などでエッジ関数を挟み、サーバーサイドで Sanity へアクセスする構成も検討してください。

---
今後は Sanity Studio から Works/Blog のドキュメントを追加・更新することでサイト側も自動的に反映されます。
