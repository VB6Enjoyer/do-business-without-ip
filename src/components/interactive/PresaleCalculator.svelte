<script lang="ts">
  import type { UIStrings } from '../../i18n/en';

  type Strings = UIStrings['tools']['presale'];
  let { strings }: { strings: Strings } = $props();
  const uid = $props.id();

  // The guide's example: a million pre-orders at $10 for each of five books.
  const TEXT = { audience: 5_000_000, share: 20, price: 10, books: 5 };

  /** Audience slider is logarithmic: position 0–100 maps to 1,000–100,000,000 readers. */
  const toAudience = (pos: number) => {
    const raw = 10 ** (3 + pos / 20);
    const magnitude = 10 ** (Math.floor(Math.log10(raw)) - 1);
    return Math.round(raw / magnitude) * magnitude; // two significant digits
  };
  const toPosition = (audience: number) => (Math.log10(audience) - 3) * 20;

  let position = $state(toPosition(TEXT.audience));
  let share = $state(TEXT.share);
  let price = $state(TEXT.price);
  let books = $state(TEXT.books);
  let target = $state(100_000);

  const audience = $derived(toAudience(position));
  const preorders = $derived(Math.round((audience * share) / 100));
  const perBook = $derived(preorders * price);
  const total = $derived(perBook * books);
  const neededPreorders = $derived(price > 0 ? Math.ceil(target / price) : 0);
  const neededShare = $derived(neededPreorders / audience);
  const isTextExample = $derived(
    audience === TEXT.audience &&
      share === TEXT.share &&
      price === TEXT.price &&
      books === TEXT.books,
  );

  const count = new Intl.NumberFormat('en-US');
  const money = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: n >= 1_000_000 ? 'compact' : 'standard',
      maximumFractionDigits: n >= 1_000_000 ? 1 : 0,
    }).format(n);
  const percent = (r: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: r < 0.01 ? 2 : 1,
    }).format(r);

  function useTextNumbers() {
    position = toPosition(TEXT.audience);
    share = TEXT.share;
    price = TEXT.price;
    books = TEXT.books;
  }
</script>

<div class="presale">
  <div class="inputs">
    <div class="slider">
      <label for={`${uid}-aud`}>{strings.audience}</label>
      <output for={`${uid}-aud`}>{count.format(audience)}</output>
      <input
        id={`${uid}-aud`}
        type="range"
        min="0"
        max="100"
        step="0.5"
        bind:value={position}
        aria-valuetext={count.format(audience)}
      />
    </div>
    <div class="slider">
      <label for={`${uid}-share`}>{strings.share}</label>
      <output for={`${uid}-share`}>{share}%</output>
      <input id={`${uid}-share`} type="range" min="1" max="100" bind:value={share} />
    </div>
    <div class="slider">
      <label for={`${uid}-price`}>{strings.price}</label>
      <output for={`${uid}-price`}>{money(price)}</output>
      <input id={`${uid}-price`} type="range" min="1" max="50" bind:value={price} />
    </div>
    <div class="slider">
      <label for={`${uid}-books`}>{strings.books}</label>
      <output for={`${uid}-books`}>{books}</output>
      <input id={`${uid}-books`} type="range" min="1" max="10" bind:value={books} />
    </div>
  </div>

  <dl class="tiles" aria-live="polite">
    <div class="tile">
      <dt>{strings.preorders}</dt>
      <dd data-presale="preorders">{count.format(preorders)}</dd>
    </div>
    <div class="tile">
      <dt>{strings.perBook}</dt>
      <dd data-presale="per-book">{money(perBook)}</dd>
    </div>
    <div class="tile">
      <dt>{strings.total}</dt>
      <dd data-presale="total">{money(total)}</dd>
    </div>
  </dl>

  <p class="example">
    {#if isTextExample}
      {strings.matchesText}
    {:else}
      <button type="button" onclick={useTextNumbers}>{strings.resetToText}</button>
    {/if}
  </p>

  <div class="target">
    <label for={`${uid}-target`}>{strings.targetLabel}</label>
    <div class="money-input">
      <span aria-hidden="true">$</span>
      <input id={`${uid}-target`} type="number" min="0" step="1000" bind:value={target} />
    </div>
    <p aria-live="polite" data-presale="target">
      {#if neededShare > 1}
        {strings.targetTooHigh}
      {:else}
        {strings.targetResult
          .replace('{n}', count.format(neededPreorders))
          .replace('{pct}', percent(neededShare))}
      {/if}
    </p>
  </div>

  <p class="caveat">{strings.caveat}</p>
</div>

<style>
  .presale {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-s);
    font-family: var(--font-sans);
    font-size: var(--step--1);
  }

  .inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-s) var(--space-l);
  }

  .slider {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: baseline;
    gap: var(--space-3xs) var(--space-s);
  }

  .slider output {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .slider input {
    grid-column: 1 / -1;
    width: 100%;
    accent-color: var(--color-accent);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: var(--space-xs);
    margin: 0;
  }

  .tile {
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--radius-m);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
  }

  .tile dt {
    color: var(--color-text-muted);
  }

  .tile dd {
    margin: 0;
    font-size: var(--step-2);
    font-weight: 600;
  }

  .example {
    margin: 0;
    color: var(--color-text-muted);
  }

  button {
    min-height: 2.25rem;
    padding: 0 var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .target {
    display: grid;
    gap: var(--space-3xs);
    padding-top: var(--space-s);
    border-top: 1px solid var(--color-border);
  }

  .target label {
    font-weight: 600;
  }

  .money-input {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3xs);
    width: fit-content;
    padding: 0 var(--space-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
  }

  .money-input input {
    width: 9rem;
    min-height: 2.25rem;
    border: 0;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    font-variant-numeric: tabular-nums;
  }

  .money-input:focus-within {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  .money-input input:focus {
    outline: none;
  }

  .target p {
    margin: 0;
    font-weight: 600;
  }

  .caveat {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
</style>
