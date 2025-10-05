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