/**
 * "Resume reading": remembers the reader's place in the guide in
 * localStorage (on their device only; nothing is sent anywhere) and offers
 * to take them back on their next visit.
 */
const KEY = 'resume:guide';
const MAX_AGE_DAYS = 180;

interface Saved {
  /** id of the last section or subsection heading above the reading line */
  id: string;
  /** scroll position as a fraction of the page, used as a fallback */
  ratio: number;
  /** title shown in the prompt */
  title: string;
  at: number;
}

const read = (): Saved | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const write = (value: Saved | null) => {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode, blocked): resume simply doesn't apply.
  }
};

export function initResume(): void {
  const prompt = document.querySelector<HTMLElement>('[data-resume]');
  const targets = [
    ...document.querySelectorAll<HTMLElement>('.guide-section, .guide-section h3[id]'),
  ];
  if (!prompt || !targets.length) return;

  const titleOf = (el: HTMLElement) =>
    (el.tagName === 'SECTION' ? el.querySelector('h2')?.textContent : el.textContent)?.trim() ?? '';

  // --- Offer to resume (only on a plain visit, not when following a link to a spot).
  const saved = read();
  const fresh = saved && Date.now() - saved.at < MAX_AGE_DAYS * 86_400_000;
  if (saved && fresh && !location.hash && saved.ratio > 0.04) {
    prompt.querySelector<HTMLElement>('[data-resume-title]')!.textContent = saved.title;
    prompt.hidden = false;
    prompt.querySelector('[data-resume-go]')!.addEventListener('click', () => {
      const el = document.getElementById(saved.id);
      if (el) el.scrollIntoView({ block: 'start' });
      else scrollTo(0, saved.ratio * document.documentElement.scrollHeight);
      prompt.hidden = true;
    });
    prompt.querySelector('[data-resume-dismiss]')!.addEventListener('click', () => {
      prompt.hidden = true;
    });
  }

  // --- Remember the current place while reading.
  let queued = false;
  let lastSave = 0;
  const save = () => {
    queued = false;
    const now = Date.now();
    if (now - lastSave < 1000) return;
    lastSave = now;
    const ratio = scrollY / Math.max(1, document.documentElement.scrollHeight);
    const notes = document.getElementById('notes');
    // Finished the guide (reached the notes): nothing to resume.
    if (notes && notes.getBoundingClientRect().top < innerHeight * 0.5) return write(null);
    let current: HTMLElement | null = null;
    for (const el of targets) {
      if (el.getBoundingClientRect().top <= innerHeight * 0.3) current = el;
      else break;
    }
    if (!current || ratio < 0.04) return;
    write({ id: current.id, ratio, title: titleOf(current), at: now });
    if (!prompt.hidden && ratio > (saved?.ratio ?? 1)) prompt.hidden = true;
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(save);
      }
    },
    { passive: true },
  );
}
