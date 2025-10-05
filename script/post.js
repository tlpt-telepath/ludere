const params = new URLSearchParams(window.location.search);
let slug = params.get('slug');

if (!slug) {
  slug = sessionStorage.getItem(window.POST_SLUG_STORAGE_KEY || 'ludere:lastPostSlug');
}

if (slug) {
  sessionStorage.setItem(window.POST_SLUG_STORAGE_KEY || 'ludere:lastPostSlug', slug);
}

const postContainer = document.getElementById('post');
const loadingEl = document.getElementById('post-loading');

const renderPortableText = (blocks = []) => {
  const fragment = document.createDocumentFragment();
  let listEl = null;
  let listType = '';

  const flushList = () => {
    if (listEl) {
      fragment.appendChild(listEl);
      listEl = null;
      listType = '';
    }
  };

  blocks.forEach((block) => {
    if (!block) return;

    if (block._type === 'block') {
      const text = Array.isArray(block.children)
        ? block.children.map((child) => child.text).join('')
        : '';

      if (block.listItem) {
        const type = block.listItem === 'number' ? 'ol' : 'ul';
        if (!listEl || listType !== type) {
          flushList();
          listEl = document.createElement(type);
          listType = type;
        }
        const li = document.createElement('li');
        li.textContent = text;
        listEl.appendChild(li);
        return;
      }

      flushList();

      let el;
      switch (block.style) {
        case 'h2':
          el = document.createElement('h2');
          break;
        case 'h3':
          el = document.createElement('h3');
          break;
        case 'h4':
          el = document.createElement('h4');
          break;
        case 'blockquote':
          el = document.createElement('blockquote');
          break;
        default:
          el = document.createElement('p');
      }
      el.textContent = text;
      fragment.appendChild(el);
      return;
    }

    flushList();
  });

  flushList();
  return fragment;
};

const renderPost = (post) => {
  if (!postContainer) return;

  if (loadingEl) loadingEl.remove();
  postContainer.textContent = '';

  if (!post) {
    const message = document.createElement('p');
    message.className = 'collection-empty';
    message.textContent = '記事が見つかりませんでした。';
    postContainer.appendChild(message);
    return;
  }

  const header = document.createElement('header');
  const meta = document.createElement('p');
  meta.className = 'post-meta';
  meta.textContent = post.publishedAt || post._createdAt
    ? `Published ${window.formatSanityDate(post.publishedAt || post._createdAt)}`
    : '';

  const title = document.createElement('h1');
  title.className = 'post-title';
  title.textContent = post.title || '';

  const summary = document.createElement('p');
  summary.className = 'post-summary';
  summary.textContent = post.summary || '';

  header.append(meta, title, summary);

  const body = document.createElement('section');
  body.className = 'post-body';
  body.appendChild(renderPortableText(post.body));

  postContainer.append(header, body);
};

const renderError = (error) => {
  console.error(error);
  if (loadingEl) loadingEl.remove();
  postContainer.textContent = '';
  const message = document.createElement('p');
  message.className = 'collection-empty';
  message.textContent = '記事を取得できませんでした。設定を確認してください。';
  postContainer.appendChild(message);
};

window.addEventListener('DOMContentLoaded', async () => {
  if (!slug) {
    if (loadingEl) loadingEl.remove();
    const message = document.createElement('p');
    message.className = 'collection-empty';
    message.textContent = '閲覧する記事が指定されていません。Blog 一覧から再度アクセスしてください。';
    postContainer.appendChild(message);
    return;
  }

  try {
    const post = await window.SanityClient.fetchPostBySlug(slug);
    renderPost(post);
  } catch (error) {
    renderError(error);
  }
});
