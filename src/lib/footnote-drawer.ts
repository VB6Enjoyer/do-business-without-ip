interface DrawerFootnote {
  n: number;
  label: string;
  href: string;
  originalUrl: string;
  archived: boolean;
  note: string | null;
}

interface DrawerStrings {
  kicker: string;
  openLink: string;
  openArchived: string;
}

const HASH = /^#fn-(\d+)$/;

/**
 * Enhances footnote markers (`a[data-fn]`) so they open the drawer instead of
 * jumping to the notes list. Deep links (`#fn-12`) open the drawer on load.
 */
export function initFootnoteDrawer(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#fn-drawer');
  const dataEl = document.querySelector('#fn-data');
  const stringsEl = document.querySelector('#fn-strings');
  if (!dialog || !dataEl || !stringsEl) return;

  const notes: DrawerFootnote[] = JSON.parse(dataEl.textContent ?? '[]');
  const strings: DrawerStrings = JSON.parse(stringsEl.textContent ?? '{}');
  const index = new Map(notes.map((fn, i) => [fn.n, i]));
  const $ = <T extends Element>(sel: string) => dialog.querySelector<T>(sel)!;

  const kicker = $<HTMLElement>('[data-fn-kicker]');
  const label = $<HTMLElement>('[data-fn-label]');
  const link = $<HTMLAnchorElement>('[data-fn-link]');
  const linkText = $<HTMLElement>('[data-fn-link-text]');
  const url = $<HTMLElement>('[data-fn-url]');
  const note = $<HTMLElement>('[data-fn-note]');
  const noteText = $<HTMLElement>('[data-fn-note-text]');
  const prev = $<HTMLButtonElement>('[data-fn-prev]');
  const next = $<HTMLButtonElement>('[data-fn-next]');

  let current = -1;

  const marker = (n: number) => document.getElementById(`fnref-${n}`);

  function render(i: number) {
    const fn = notes[i];
    current = i;
    kicker.textContent = strings.kicker
      .replace('{n}', String(fn.n))
      .replace('{total}', String(notes.length));
    label.textContent = fn.label;
    link.href = fn.href;
    linkText.textContent = fn.archived ? strings.openArchived : strings.openLink;
    url.textContent = fn.originalUrl;
    note.hidden = !fn.note;
    noteText.textContent = fn.note ?? '';
    prev.disabled = i === 0;
    next.disabled = i === notes.length - 1;
    history.replaceState(history.state, '', `#fn-${fn.n}`);
  }

  function open(n: number) {
    const i = index.get(n);
    if (i === undefined) return false;
    render(i);
    if (!dialog!.open) dialog!.showModal();
    return true;
  }

  function step(delta: number) {
    const i = current + delta;
    if (i < 0 || i >= notes.length) return;
    render(i);
    // Keep focus on the button that was used, unless it just became disabled.
    const used = delta < 0 ? prev : next;
    if (used.disabled) (delta < 0 ? next : prev).focus();
  }

  // Markers become dialog openers.
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-fn]')) {
    a.setAttribute('aria-haspopup', 'dialog');
    a.setAttribute('aria-controls', 'fn-drawer');
  }

  document.addEventListener('click', (event) => {
    const a = (event.target as Element).closest<HTMLAnchorElement>('a[data-fn]');
    if (
      !a ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (open(Number(a.dataset.fn))) event.preventDefault();
  });

  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  $<HTMLButtonElement>('[data-fn-close]').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
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
    const ref = marker(notes[current]?.n);
    if (ref) {
      ref.scrollIntoView({ block: 'center' });
      ref.focus({ preventScroll: true });
    }
  });

  const fromHash = () => {
    const m = location.hash.match(HASH);
    if (!m) return;
    const n = Number(m[1]);
    marker(n)?.scrollIntoView({ block: 'center' });
    open(n);
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}
