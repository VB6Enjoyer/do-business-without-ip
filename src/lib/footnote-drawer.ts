interface DrawerFootnote {
  n: number;
  label: string;
  href: string;
  usesArchive: boolean;
  archiveUrl: string | null;
  archiveYear: string | null;
  originalUrl: string;
  linkNote: string | null;
  checkedOn: string;
}

interface DrawerUpdate {
  id: string;
  title: string;
}

interface DrawerData {
  footnotes: DrawerFootnote[];
  updates: DrawerUpdate[];
  strings: Record<string, string>;
}

type Mode = 'footnote' | 'update';

const FOOTNOTE_HASH = /^#fn-(\d+)$/;
const UPDATE_HASH = /^#since-([a-z0-9-]+)$/;

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

/**
 * Enhances footnote markers (`a[data-fn]`) and update markers
 * (`a[data-update]`) so they open the drawer instead of jumping to the lists
 * at the end of the guide. Deep links (`#fn-12`, `#since-tpp`) open it on load.
 */
export function initDrawer(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#fn-drawer');
  const dataEl = document.querySelector('#drawer-data');
  if (!dialog || !dataEl) return;

  const { footnotes, updates, strings }: DrawerData = JSON.parse(dataEl.textContent ?? '{}');
  const $ = <T extends Element>(sel: string) => dialog.querySelector<T>(sel)!;

  const kicker = $<HTMLElement>('[data-drawer-kicker]');
  const title = $<HTMLElement>('[data-drawer-title]');
  const close = $<HTMLButtonElement>('[data-drawer-close]');
  const prev = $<HTMLButtonElement>('[data-drawer-prev]');
  const next = $<HTMLButtonElement>('[data-drawer-next]');
  const hint = $<HTMLElement>('[data-drawer-hint]');
  const footnoteBody = $<HTMLElement>('[data-mode="footnote"]');
  const updateBody = $<HTMLElement>('[data-mode="update"]');

  const link = $<HTMLAnchorElement>('[data-fn-link]');
  const linkText = $<HTMLElement>('[data-fn-link-text]');
  const archiveRow = $<HTMLElement>('[data-fn-archive-row]');
  const archive = $<HTMLAnchorElement>('[data-fn-archive]');
  const linkNote = $<HTMLElement>('[data-fn-link-note]');
  const url = $<HTMLElement>('[data-fn-url]');
  const checked = $<HTMLElement>('[data-fn-checked]');
  const updateContent = $<HTMLElement>('[data-update-body]');

  let mode: Mode = 'footnote';
  let current = -1;

  const length = () => (mode === 'footnote' ? footnotes.length : updates.length);
  const markerId = () =>
    mode === 'footnote' ? `fnref-${footnotes[current]?.n}` : `sinceref-${updates[current]?.id}`;

  function renderFootnote(fn: DrawerFootnote) {
    kicker.textContent = fill(strings.kicker, { n: fn.n, total: footnotes.length });
    title.textContent = fn.label;
    link.href = fn.href;
    linkText.textContent = fn.usesArchive
      ? fill(strings.openArchived, { year: fn.archiveYear ?? '' })
      : strings.openLink;
    // Offer the archived copy as a secondary link when the original is the primary one.
    const showArchive = !fn.usesArchive && fn.archiveUrl !== null;
    archiveRow.hidden = !showArchive;
    if (showArchive) {
      archive.href = fn.archiveUrl!;
      archive.textContent = fill(strings.archivedCopy, { year: fn.archiveYear ?? '' });
    }
    linkNote.hidden = !fn.linkNote;
    linkNote.textContent = fn.linkNote ?? '';
    url.textContent = fn.originalUrl;
    checked.textContent = fill(strings.checkedOn, { date: fn.checkedOn });
    history.replaceState(history.state, '', `#fn-${fn.n}`);
  }

  function renderUpdate(update: DrawerUpdate) {
    kicker.textContent = fill(strings.updateKicker, {
      n: current + 1,
      total: updates.length,
    });
    title.textContent = update.title;
    const source = document.querySelector(`#since-${update.id} [data-update-content]`);
    updateContent.innerHTML = source?.innerHTML ?? '';
    history.replaceState(history.state, '', `#since-${update.id}`);
  }

  function render(i: number) {
    current = i;
    const isFootnote = mode === 'footnote';
    footnoteBody.hidden = !isFootnote;
    updateBody.hidden = isFootnote;
    close.setAttribute('aria-label', isFootnote ? strings.close : strings.closeUpdate);
    prev.setAttribute(
      'aria-label',
      isFootnote ? strings.previousLabel : strings.previousUpdateLabel,
    );
    next.setAttribute('aria-label', isFootnote ? strings.nextLabel : strings.nextUpdateLabel);
    hint.textContent = isFootnote ? strings.keyboardHint : strings.keyboardHintUpdates;
    if (isFootnote) renderFootnote(footnotes[i]);
    else renderUpdate(updates[i]);
    prev.disabled = i === 0;
    next.disabled = i === length() - 1;
  }

  function open(newMode: Mode, i: number) {
    if (i < 0) return false;
    mode = newMode;
    render(i);
    if (!dialog!.open) {
      dialog!.showModal();
      close.focus();
    }
    return true;
  }

  const openFootnote = (n: number) =>
    open(
      'footnote',
      footnotes.findIndex((f) => f.n === n),
    );
  const openUpdate = (id: string) =>
    open(
      'update',
      updates.findIndex((u) => u.id === id),
    );

  function step(delta: number) {
    const i = current + delta;
    if (i < 0 || i >= length()) return;
    render(i);
    // Keep focus on the button that was used, unless it just became disabled.
    const used = delta < 0 ? prev : next;
    if (used.disabled) (delta < 0 ? next : prev).focus();
  }

  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-fn], a[data-update]')) {
    a.setAttribute('aria-haspopup', 'dialog');
    a.setAttribute('aria-controls', 'fn-drawer');
  }

  document.addEventListener('click', (event) => {
    const a = (event.target as Element).closest<HTMLAnchorElement>('a[data-fn], a[data-update]');
    if (
      !a ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const opened = a.dataset.fn
      ? openFootnote(Number(a.dataset.fn))
      : openUpdate(a.dataset.update!);
    if (opened) event.preventDefault();
  });

  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  close.addEventListener('click', () => dialog.close());

  // Listen on the document: when the drawer opens from a deep link on page
  // load, focus may not be inside it yet. The modal makes the page inert, so
  // arrow keys can only mean "next/previous" while it is open.
  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
    else return;
    event.preventDefault();
  });

  // Clicks on the backdrop land on the <dialog> itself (the panel fills it).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    history.replaceState(history.state, '', location.pathname + location.search);
    const ref = document.getElementById(markerId());
    if (ref) {
      ref.scrollIntoView({ block: 'center' });
      ref.focus({ preventScroll: true });
    }
  });

  const fromHash = () => {
    const fn = location.hash.match(FOOTNOTE_HASH);
    const up = location.hash.match(UPDATE_HASH);
    if (fn) {
      document.getElementById(`fnref-${fn[1]}`)?.scrollIntoView({ block: 'center' });
      openFootnote(Number(fn[1]));
    } else if (up) {
      document.getElementById(`sinceref-${up[1]}`)?.scrollIntoView({ block: 'center' });
      openUpdate(up[1]);
    }
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}
