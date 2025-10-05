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