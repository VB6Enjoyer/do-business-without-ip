<script lang="ts">
  import type { UIStrings } from '../../i18n/en';

  type Strings = UIStrings['interactive']['covenant'];
  type Mode = 'covenant' | 'ip';
  type Outcome = 'idle' | 'painted' | 'vetoed';

  let { strings }: { strings: Strings } = $props();

  const SIZE = 10;
  const YOU = 44; // fifth row, fifth column
  const houses = Array.from({ length: SIZE * SIZE }, (_, i) => i);

  let mode = $state<Mode>('covenant');
  let signed = $state(false);
  let outcome = $state<Outcome>('idle');
  let shaking = $state(false);
  const uid = $props.id();

  const message = $derived.by(() => {
    if (outcome === 'idle') return '';
    if (mode === 'ip') return strings.resultIpVetoed;
    return signed ? strings.resultSignedVetoed : strings.resultUnsignedPainted;
  });

  const statusText = $derived(
    outcome === 'painted'
      ? strings.statusPainted
      : outcome === 'vetoed'
        ? strings.statusVetoed
        : strings.statusIdle,
  );

  function paint() {
    const allowed = mode === 'covenant' && !signed;
    outcome = allowed ? 'painted' : 'vetoed';
    if (!allowed) {
      shaking = false;
      requestAnimationFrame(() => (shaking = true));
    }
  }

  function reset() {
    outcome = 'idle';
    shaking = false;
  }

  function setMode(next: Mode) {
    mode = next;
    reset();
  }
</script>

<div class="covenant" data-mode={mode}>
  <fieldset class="modes">
    <legend>{strings.modeLabel}</legend>
    <label>
      <input
        type="radio"
        name={`${uid}-mode`}
        value="covenant"
        checked={mode === 'covenant'}
        onchange={() => setMode('covenant')}
      />
      {strings.modeCovenant}
    </label>
    <label>
      <input
        type="radio"
        name={`${uid}-mode`}
        value="ip"
        checked={mode === 'ip'}
        onchange={() => setMode('ip')}
      />
      {strings.modeIp}
    </label>
  </fieldset>

  <div class="scenario">
    {#if mode === 'covenant'}
      <p>{strings.covenantInfo}</p>
      <label class="sign">
        <input type="checkbox" bind:checked={signed} onchange={reset} />
        {strings.signLabel}
      </label>
    {:else}
      <p>{strings.ipInfo}</p>
      <div class="holder">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"></path>
        </svg>
        <div>
          <strong>{strings.holder}</strong>
          <span>{strings.holderPatent}</span>
        </div>
      </div>
    {/if}
  </div>

  <div class="stage">
    <div class="grid" role="img" aria-label={strings.gridLabel.replace('{status}', statusText)}>
      {#each houses as i (i)}
        {@const isYou = i === YOU}
        <span
          class="house"
          class:you={isYou}
          class:painted={isYou && outcome === 'painted'}
          class:vetoed={isYou && outcome === 'vetoed'}
          class:shake={isYou && shaking}
          class:signed={mode === 'covenant' && (!isYou || signed)}
          class:burdened={mode === 'ip'}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path class="body" d="M3 9.5 10 3l7 6.5V17H3Z"></path>
            <path class="door" d="M8.5 17v-4h3v4"></path>
          </svg>
          {#if mode === 'covenant' && (!isYou || signed)}
            <span class="badge badge-signed" aria-hidden="true"></span>
          {:else if mode === 'ip'}
            <span class="badge badge-lock" aria-hidden="true"></span>
          {/if}
        </span>
      {/each}
    </div>

    <ul class="legend" aria-hidden="true">
      <li><span class="key key-you"></span>{strings.legendYou}</li>
      {#if mode === 'covenant'}
        <li><span class="key key-signed"></span>{strings.legendSigned}</li>
      {:else}
        <li><span class="key key-lock"></span>{strings.legendBurdened}</li>
      {/if}
    </ul>
  </div>

  <div class="actions">
    <button type="button" class="primary" onclick={paint} disabled={outcome !== 'idle'}>
      <span class="swatch" aria-hidden="true"></span>
      {strings.paint}
    </button>
    {#if outcome !== 'idle'}
      <button type="button" onclick={reset}>{strings.reset}</button>
    {/if}
  </div>

  <div class="result" role="status" aria-live="polite">
    {#if message}
      <p class:ok={outcome === 'painted'} class:no={outcome === 'vetoed'}>{message}</p>
      {#if mode === 'ip'}
        <p class="note">{strings.ipNote}</p>
      {/if}
    {/if}
  </div>
</div>

<style>
  .covenant {
    display: grid;
    /* Let children shrink to the container instead of growing it. */
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-s);
    font-family: var(--font-sans);
    font-size: var(--step--1);
  }

  .modes {
    display: flex;
    min-inline-size: 0;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    margin: 0;
    padding: 0;
    border: 0;
  }

  .modes legend {
    width: 100%;
    margin-bottom: var(--space-2xs);
    font-weight: 600;
  }

  .modes label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-2xs) var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    cursor: pointer;
  }

  .modes label:has(input:checked) {
    border-color: var(--color-accent);
    background: var(--color-highlight);
    font-weight: 600;
  }

  .modes label:has(input:focus-visible) {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  .modes input {
    accent-color: var(--color-accent);
  }

  .scenario p {
    margin: 0 0 var(--space-2xs);
  }

  .sign {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    font-weight: 600;
    cursor: pointer;
  }

  .sign input {
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--color-accent);
  }

  .holder {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-2xs) var(--space-s);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-s);
    width: fit-content;
  }

  .holder svg {
    width: 1.75rem;
    height: 1.75rem;
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .holder div {
    display: grid;
  }

  .holder span {
    color: var(--color-text-muted);
  }

  .stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-2xs);
    justify-items: start;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 4px;
    width: min(100%, 22rem);
    padding: var(--space-xs);
    border-radius: var(--radius-m);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
  }

  .house {
    position: relative;
    aspect-ratio: 1;
  }

  .house svg {
    width: 100%;
    height: 100%;
  }

  .house .body {
    fill: var(--color-placeholder);
    stroke: var(--color-text-muted);
    stroke-width: 1;
    stroke-linejoin: round;
    transition: fill var(--duration) var(--ease);
  }

  .house .door {
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1;
  }

  .house.you .body {
    stroke: var(--color-text);
    stroke-width: 2;
  }

  .house.painted .body {
    fill: var(--paint-orange);
  }

  .house.vetoed .body {
    fill: var(--color-placeholder);
  }

  .house.shake {
    animation: shake 400ms var(--ease);
  }

  @keyframes shake {
    25% {
      transform: translateX(-3px);
    }
    50% {
      transform: translateX(3px);
    }
    75% {
      transform: translateX(-2px);
    }
  }

  .badge {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 38%;
    height: 38%;
    border-radius: 50%;
    border: 1px solid var(--color-surface);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-m);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--color-text-muted);
  }

  .legend li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
  }

  .key {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
  }

  .key-you {
    border: 2px solid var(--color-text);
    border-radius: 2px;
  }

  /* Badge and legend key share one shape per meaning. */
  .badge-signed,
  .key-signed {
    background: var(--chart-line);
    border-radius: 50%;
  }

  .badge-lock,
  .key-lock {
    background: var(--color-text-muted);
    border-radius: 2px;
  }

  .badge-lock {
    width: 30%;
    height: 30%;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    min-height: 2.5rem;
    padding: 0 var(--space-m);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  button.primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .swatch {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: var(--paint-orange);
    border: 1px solid var(--color-accent-contrast);
  }

  .result p {
    margin: 0 0 var(--space-2xs);
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--radius-s);
    border-inline-start: 3px solid var(--color-border);
    background: var(--color-surface);
  }

  .result p.ok {
    border-inline-start-color: var(--chart-line);
  }

  .result p.no {
    border-inline-start-color: var(--color-text);
    font-weight: 600;
  }

  .result p.note {
    border-inline-start-color: transparent;
    background: transparent;
    padding-block: 0;
    color: var(--color-text-muted);
  }
</style>
