import { shareTargets } from './share';

interface QuoteStrings {
  attribution: string;
  siteName: string;
  copied: string;
  shareOn: string;
}

const CARD = { width: 1200, height: 630, pad: 88 };
// The card always uses the light palette so shared images look the same everywhere.
const COLORS = { bg: '#f8f5ef', text: '#1f1c18', muted: '#5d5650', accent: '#2f6b3c' };
const SERIF = '"Source Serif 4 Variable", Georgia, serif';
const SANS = '"Inter Variable", system-ui, sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCard(quote: string, strings: QuoteStrings): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load(`600 48px ${SERIF}`),
    document.fonts.load(`500 24px ${SANS}`),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext('2d')!;
  const maxWidth = CARD.width - CARD.pad * 2;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD.width, CARD.height);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, 0, 14, CARD.height);

  // Largest font size (56 → 32px) at which the quote fits in five lines.
  let size = 56;
  let lines: string[] = [];
  for (; size >= 32; size -= 4) {
    ctx.font = `600 ${size}px ${SERIF}`;
    lines = wrap(ctx, `“${quote}”`, maxWidth);
    if (lines.length <= 5) break;
  }
  const lineHeight = size * 1.25;
  const blockHeight = lines.length * lineHeight;
  let y = (CARD.height - blockHeight) / 2 - 24 + size;
  ctx.fillStyle = COLORS.text;
  ctx.textBaseline = 'alphabetic';
  for (const line of lines) {
    ctx.fillText(line, CARD.pad, y);
    y += lineHeight;
  }

  ctx.font = `500 26px ${SANS}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(`— ${strings.attribution}`, CARD.pad, y + 28);

  ctx.font = `700 20px ${SANS}`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(strings.siteName.toUpperCase(), CARD.pad, CARD.height - 56);
  return canvas;
}

/** Reveals the pull quotes' share buttons and wires them to the share dialog. */
export function initQuoteShare(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#quote-dialog');
  const stringsEl = document.querySelector('#quote-strings');
  if (!dialog || !stringsEl) return;
  const strings: QuoteStrings = JSON.parse(stringsEl.textContent ?? '{}');
  const $ = <T extends Element>(sel: string) => dialog.querySelector<T>(sel)!;

  const preview = $<HTMLImageElement>('[data-quote-preview]');
  const status = $<HTMLElement>('[data-quote-status]');
  const native = $<HTMLButtonElement>('[data-quote-native]');

  let opener: HTMLElement | null = null;
  let current = { id: '', text: '' };
  let canvas: HTMLCanvasElement | null = null;

  const shareUrl = () => `${location.origin}${location.pathname}#${current.id}`;
  const shareText = () => `“${current.text}”\n— ${strings.attribution}\n${shareUrl()}`;
  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      if (canvas) canvas.toBlob(resolve, 'image/png');
      else resolve(null);
    });

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-quote-share]')) {
    button.hidden = false;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', async () => {
      const quote = document.getElementById(button.dataset.quoteShare!);
      if (!quote) return;
      opener = button;
      current = { id: quote.id, text: quote.dataset.quote ?? '' };
      status.textContent = '';
      native.hidden = typeof navigator.share !== 'function';
      preview.removeAttribute('src');
      // Social links for this quote (plain links, built on demand).
      const social = $<HTMLUListElement>('[data-quote-social]');
      social.replaceChildren(
        ...shareTargets(
          shareUrl(),
          `“${current.text}” — ${strings.attribution}`,
          strings.attribution,
        ).map((target) => {
          const li = document.createElement('li');
          const a = Object.assign(document.createElement('a'), {
            href: target.href,
            textContent: target.name,
            rel: 'noopener noreferrer',
          });
          if (target.id !== 'email') a.target = '_blank';
          a.setAttribute('aria-label', strings.shareOn.replace('{network}', target.name));
          li.append(a);
          return li;
        }),
      );
      dialog.showModal();
      canvas = await drawCard(current.text, strings);
      preview.src = canvas.toDataURL('image/png');
    });
  }

  $<HTMLButtonElement>('[data-quote-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus());

  $<HTMLButtonElement>('[data-quote-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      status.textContent = strings.copied;
    } catch {
      status.textContent = '';
    }
  });

  $<HTMLButtonElement>('[data-quote-download]').addEventListener('click', async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `kinsella-quote-${current.id}.png`,
    });
    // Inside a modal dialog, a link must be in the dialog to be clickable.
    dialog.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  native.addEventListener('click', async () => {
    const blob = await toBlob();
    const file = blob ? new File([blob], 'quote.png', { type: 'image/png' }) : null;
    const data: ShareData = { text: shareText(), url: shareUrl() };
    if (file && navigator.canShare?.({ files: [file] })) data.files = [file];
    try {
      await navigator.share(data);
    } catch {
      // Cancelled by the user.
    }
  });
}
