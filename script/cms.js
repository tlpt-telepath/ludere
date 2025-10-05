const sanityConfig = {
  projectId: window.SANITY_PROJECT_ID || '',
  dataset: window.SANITY_DATASET || 'production',
  apiVersion: window.SANITY_API_VERSION || '2024-05-01',
  useCdn: window.SANITY_USE_CDN !== undefined ? window.SANITY_USE_CDN : true,
  token: window.SANITY_READ_TOKEN || ''
};

const sanityQueries = {
  works: `*[_type == "work"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    summary,
    publishedAt,
    _createdAt,
    "mediaUrl": coalesce(mainImage.asset->url, coverImage.asset->url),
    "slug": slug.current,
    url
  }`,
  blog: `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    summary,
    publishedAt,
    _createdAt,
    "slug": slug.current,
    url
  }`
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.warn('Failed to parse date', value, error);
    return '';
  }
};

const buildSanityUrl = (query, params) => {
  const { projectId, dataset, apiVersion } = sanityConfig;
  let url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      const formatted = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value ?? null);
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(formatted)}`;
    });
  }
  return url;
};

const fetchSanity = async (query, params) => {
  if (!sanityConfig.projectId) {
    throw new Error('Sanity projectId is not configured. Set window.SANITY_PROJECT_ID.');
  }

  const url = buildSanityUrl(query, params);
  const headers = sanityConfig.token ? { Authorization: `Bearer ${sanityConfig.token}` } : {};

  const response = await fetch(url, { headers, cache: sanityConfig.useCdn ? 'force-cache' : 'no-store' });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sanity request failed: ${response.status} ${message}`);
  }

  const { result } = await response.json();
  return result;
};

const sanityClient = {
  fetchCollection: async (collectionKey) => {
    const query = sanityQueries[collectionKey];
    if (!query) throw new Error(`Unknown Sanity collection: ${collectionKey}`);
    const result = await fetchSanity(query);
    return Array.isArray(result) ? result : [];
  },
  fetchPostBySlug: async (slug) => {
    const query = `*[_type == "post" && slug.current == $slug][0]{
      _id,
      title,
      summary,
      body,
      publishedAt,
      _createdAt,
      "slug": slug.current
    }`;
    return fetchSanity(query, { "$slug": slug });
  }
};

const POST_SLUG_STORAGE_KEY = 'ludere:lastPostSlug';
const createInternalPostLink = (slug) => `./post/?slug=${encodeURIComponent(slug)}`;

const shouldBypassNavigation = (event) =>
  event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const attachPostLinkHandler = (linkEl, slug) => {
  if (!linkEl) return;
  const targetUrl = createInternalPostLink(slug);
  linkEl.dataset.slug = slug;
  linkEl.href = targetUrl;
  linkEl.removeAttribute('target');
  linkEl.removeAttribute('rel');

  linkEl.addEventListener('click', (event) => {
    if (shouldBypassNavigation(event)) return;
    event.preventDefault();
    sessionStorage.setItem(POST_SLUG_STORAGE_KEY, slug);
    window.location.assign(targetUrl);
  });
};

const renderCollection = async (section) => {
  const collectionKey = section.dataset.collection;
  if (!collectionKey) return;

  const itemsContainer = section.querySelector('.collection-items');
  const emptyState = section.querySelector('.collection-empty');
  const template = section.querySelector('template');

  if (!itemsContainer || !template) return;

  const loadingIndicator = document.createElement('p');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = '読み込み中です…';
  itemsContainer.replaceChildren(loadingIndicator);

  try {
    const items = await sanityClient.fetchCollection(collectionKey);

    if (!items.length) {
      itemsContainer.textContent = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const titleEl = card.querySelector('[data-title]');
      const summaryEl = card.querySelector('[data-summary]');
      const metaEl = card.querySelector('[data-meta]');
      const linkEl = card.querySelector('[data-link]');
      const mediaContainer = card.querySelector('[data-media]');

      if (titleEl) titleEl.textContent = item.title || 'Untitled';
      if (summaryEl) summaryEl.textContent = item.summary || '';
      if (metaEl) {
        const published = formatDate(item.publishedAt || item._createdAt);
        metaEl.textContent = published ? `Published ${published}` : '';
      }

      if (linkEl) {
        if (collectionKey === 'blog') {
          const slugValue = item.slug ? String(item.slug).trim() : '';
          if (slugValue) {
            attachPostLinkHandler(linkEl, slugValue);
          } else if (item.url && /^https?:/i.test(item.url)) {
            linkEl.href = item.url;
            linkEl.target = '_blank';
            linkEl.rel = 'noopener';
          } else {
            console.warn('Sanity post is missing slug and url; link removed', item);
            linkEl.remove();
          }
        } else {
          let href = '';
          if (item.url && /^https?:/i.test(item.url)) {
            href = item.url;
          } else if (item.slug) {
            href = `/${item.slug}`;
          }

          if (href) {
            linkEl.href = href;
          } else {
            linkEl.remove();
          }
        }
      }

      if (mediaContainer) {
        mediaContainer.textContent = '';
        if (item.mediaUrl) {
          const image = document.createElement('img');
          image.src = item.mediaUrl;
          image.alt = item.title || '';
          mediaContainer.appendChild(image);
        }
      }

      fragment.appendChild(card);
    });

    itemsContainer.replaceChildren(fragment);
    if (emptyState) emptyState.hidden = true;

    if (collectionKey === 'works' && Array.isArray(items) && items.length > 1) {
      itemsContainer.dataset.layout = 'grid';
    }
  } catch (error) {
    console.error(error);
    itemsContainer.textContent = '';
    const errorMessage = document.createElement('p');
    errorMessage.className = 'collection-empty';
    errorMessage.hidden = false;
    errorMessage.textContent = 'Sanity からデータを取得できませんでした。設定を確認してください。';
    itemsContainer.appendChild(errorMessage);
    if (emptyState) emptyState.hidden = true;
  }
};

window.SanityClient = sanityClient;
window.formatSanityDate = formatDate;
window.POST_SLUG_STORAGE_KEY = POST_SLUG_STORAGE_KEY;

window.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.content-collection[data-collection]');
  if (!sections.length) return;
  sections.forEach((section) => {
    renderCollection(section);
  });
});
