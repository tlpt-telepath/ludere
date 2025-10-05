const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const body = document.body;

if (menuButton && nav) {
  const setExpanded = (expanded) => {
    menuButton.classList.toggle('is-open', expanded);
    nav.classList.toggle('open', expanded);
    body.classList.toggle('menu-open', expanded);
    menuButton.setAttribute('aria-expanded', String(expanded));
  };

  menuButton.addEventListener('click', () => {
    const willOpen = !nav.classList.contains('open');
    setExpanded(willOpen);
  });

  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement || event.target === nav) {
      setExpanded(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setExpanded(false);
    }
  });

  setExpanded(false);
}
