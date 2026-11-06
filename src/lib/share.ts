/**
 * Plain share links: no third-party scripts, nothing loaded until the reader
 * clicks. Each network's public "share intent" URL.
 */
export interface ShareTarget {
  id: string;
  name: string;
  href: string;
}

export function shareTargets(url: string, text: string, title = text): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const both = encodeURIComponent(`${text} ${url}`);
  return [
    { id: 'x', name: 'X', href: `https://x.com/intent/post?text=${t}&url=${u}` },
    {
      id: 'reddit',
      name: 'Reddit',
      href: `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent(title)}`,
    },
    { id: 'bluesky', name: 'Bluesky', href: `https://bsky.app/intent/compose?text=${both}` },
    { id: 'facebook', name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    { id: 'telegram', name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: 'whatsapp', name: 'WhatsApp', href: `https://wa.me/?text=${both}` },
    {
      id: 'email',
      name: 'Email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${both}`,
    },
  ];
}
