/**
 * Marks the table-of-contents entry for the section being read with
 * aria-current="location", mirrors the current section title into the mobile
 * contents bar, and closes that bar after a link is followed.
 */
export function initScrollspy(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-toc-target]')];
  const ids = [...new Set(links.map((a) => a.dataset.tocTarget!))];
  const targets = ids
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  const current = document.querySelector<HTMLElement>('[data-toc-current]');
  const mobile = document.querySelector<HTMLDetailsElement>('[data-toc-mobile]');
  const sidebar = document.querySelector<HTMLElement>('.guide-toc nav');
  if (!targets.length) return;

  // Section titles (top-level entries) for the mobile bar.
  const sectionTitle = new Map<string, string>();
  for (const a of document.querySelectorAll<HTMLAnchorElement>('.toc-list > li > a')) {
    const title = a.querySelector('span:last-child')?.textContent ?? a.textContent ?? '';
    sectionTitle.set(a.dataset.tocTarget!, title.trim());
    for (const sub of a.parentElement!.querySelectorAll<HTMLAnchorElement>('ol a')) {
      sectionTitle.set(sub.dataset.tocTarget!, title.trim());
    }
  }

  let active = '';
  let queued = false;

  function update() {
    queued = false;
    const line = innerHeight * 0.3;
    let id = '';
    for (const el of targets) {
      if (el.getBoundingClientRect().top <= line) id = el.id;
      else break;
    }
    if (id === active) return;
    active = id;
    for (const a of links) {
      if (a.dataset.tocTarget === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    if (current) current.textContent = sectionTitle.get(id) ?? '';
    const inSidebar = sidebar?.querySelector<HTMLElement>(`a[data-toc-target="${id}"]`);
    if (sidebar && inSidebar) {
      const { top, bottom } = inSidebar.getBoundingClientRect();
      const box = sidebar.getBoundingClientRect();
      if (top < box.top || bottom > box.bottom) {
        sidebar.scrollTop += top - box.top - box.height / 3;
      }
    }
  }

  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();

  mobile?.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) mobile.open = false;
  });
}
