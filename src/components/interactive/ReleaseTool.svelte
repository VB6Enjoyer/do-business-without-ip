<script lang="ts">
  import type { UIStrings } from '../../i18n/en';

  type Strings = UIStrings['tools']['release'];
  type License = 'cc0' | 'ccby';
  type Format = keyof Strings['formats'];

  let { strings, currentYear }: { strings: Strings; currentYear: number } = $props();
  const uid = $props.id();

  let license = $state<License>('cc0');
  let title = $state('');
  let author = $state('');
  let year = $state(currentYear);
  let workUrl = $state('');
  let format = $state<Format>('text');
  let pledge = $state(false);
  let copied = $state(false);

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapeMd = (s: string) => s.replace(/([\\[\]()*_`<>])/g, '\\$1');
  const safeUrl = (s: string) => (/^https?:\/\//i.test(s.trim()) ? s.trim() : '');

  const info = $derived(strings[license]);
  const notice = $derived.by(() => {
    const t = title.trim() || strings.placeholderTitle;
    const a = author.trim() || strings.placeholderAuthor;
    const url = safeUrl(workUrl);
    const template = license === 'cc0' ? strings.noticeCc0 : strings.noticeCcby;
    const pledgeText = (titleText: string, authorText: string) =>
      strings.pledge.replaceAll('{title}', titleText).replaceAll('{author}', authorText);

    if (format === 'html') {
      const titleHtml = url ? `<a href="${escapeHtml(url)}">${escapeHtml(t)}</a>` : escapeHtml(t);
      const licenseHtml = `<a href="${info.url}" rel="license">${info.name}</a>`;
      let out = `<p>${template
        .replace('{title}', titleHtml)
        .replace('{author}', escapeHtml(a))
        .replace('{year}', String(year))
        .replace('{license}', licenseHtml)}</p>`;
      if (pledge) out += `\n<p>${pledgeText(escapeHtml(t), escapeHtml(a))}</p>`;
      return out;
    }
    if (format === 'markdown') {
      const titleMd = url ? `[${escapeMd(t)}](${url})` : escapeMd(t);
      let out = template
        .replace('{title}', titleMd)
        .replace('{author}', escapeMd(a))
        .replace('{year}', String(year))
        .replace('{license}', `[${info.name}](${info.url})`);
      if (pledge) out += `\n\n${pledgeText(escapeMd(t), escapeMd(a))}`;
      return out;
    }
    let out = template
      .replace('{title}', t)
      .replace('{author}', a)
      .replace('{year}', String(year))
      .replace('{license}', `${info.name} (${info.url})`);
    if (url) out += `\n${url}`;
    if (pledge) out += `\n\n${pledgeText(t, a)}`;
    return out;
  });

  $effect(() => {
    void notice; // any change to the notice clears the "Copied" state
    copied = false;
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(notice);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<div class="release">
  <fieldset class="licenses">
    <legend>{strings.licenseLegend}</legend>
    {#each ['cc0', 'ccby'] as const as id (id)}
      <label class="license">
        <input type="radio" name={`${uid}-license`} value={id} bind:group={license} />
        <span>
          <strong>{strings[id].label}</strong>
          <span class="summary">{strings[id].summary}</span>
        </span>
      </label>
    {/each}
  </fieldset>

  <div class="fields">
    <label>
      <span>{strings.workTitle}</span>
      <input type="text" bind:value={title} placeholder={strings.placeholderTitle} />
    </label>
    <label>
      <span>{strings.author}</span>
      <input type="text" bind:value={author} autocomplete="name" />
    </label>
    <label class="short">
      <span>{strings.year}</span>
      <input type="number" bind:value={year} min="1900" max="2100" />
    </label>
    <label class="wide">
      <span>{strings.workUrl}</span>
      <input type="url" bind:value={workUrl} placeholder="https://" />
    </label>
  </div>

  <label class="pledge">
    <input type="checkbox" bind:checked={pledge} />
    <span>
      <strong>{strings.pledgeToggle}</strong>
      <span class="summary">{strings.pledgeHelp}</span>
    </span>
  </label>

  <div class="output">
    <fieldset class="formats">
      <legend>{strings.outputLegend}</legend>
      {#each Object.keys(strings.formats) as Format[] as f (f)}
        <label>
          <input type="radio" name={`${uid}-format`} value={f} bind:group={format} />
          {strings.formats[f]}
        </label>
      {/each}
    </fieldset>
    <pre data-release-output><code>{notice}</code></pre>
    <div class="copy-row">
      <button type="button" onclick={copy}>{strings.copy}</button>
      <span class="copied" role="status">{copied ? strings.copied : ''}</span>
    </div>
  </div>

  <p class="disclaimer">{strings.disclaimer}</p>
</div>

<style>
  .release {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-s);
    font-family: var(--font-sans);
    font-size: var(--step--1);
  }

  fieldset {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    padding: 0;
    margin-bottom: var(--space-2xs);
    font-weight: 600;
  }

  .licenses {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-2xs);
  }

  .licenses legend {
    grid-column: 1 / -1;
  }

  .license,
  .pledge {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
    cursor: pointer;
  }

  .license:has(input:checked),
  .pledge:has(input:checked) {
    border-color: var(--color-accent);
    background: var(--color-highlight);
  }

  .license input,
  .pledge input {
    margin-top: 0.2rem;
    accent-color: var(--color-accent);
  }

  .license > span,
  .pledge > span {
    display: grid;
    gap: 2px;
  }

  .summary {
    color: var(--color-text-muted);
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--space-xs) var(--space-s);
  }

  .fields label {
    display: grid;
    gap: var(--space-3xs);
    font-weight: 600;
  }

  .fields .wide {
    grid-column: 1 / -1;
  }

  .fields input {
    min-height: 2.25rem;
    padding: 0 var(--space-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 400;
  }

  .formats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-s);
  }

  .formats legend {
    width: 100%;
  }

  .formats label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    cursor: pointer;
  }

  .formats input {
    accent-color: var(--color-accent);
  }

  pre {
    margin: var(--space-2xs) 0;
    padding: var(--space-s);
    border-radius: var(--radius-s);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .copy-row {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  button {
    min-height: 2.25rem;
    padding: 0 var(--space-m);
    border: 1px solid var(--color-accent);
    border-radius: 999px;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .copied {
    font-weight: 600;
    color: var(--color-accent-strong);
  }

  .disclaimer {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
</style>
