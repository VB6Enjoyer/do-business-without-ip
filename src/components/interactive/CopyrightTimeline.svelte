<script lang="ts">
  import type { UIStrings } from '../../i18n/en';
  import { LAWS, termYears, type TermLaw, type WorkKind } from '../../lib/copyright-terms';

  type Strings = UIStrings['interactive']['timeline'];

  let { strings, currentYear }: { strings: Strings; currentYear: number } = $props();

  const uid = $props.id();
  let kind = $state<WorkKind>('author');
  let ageAtCreation = $state(35);
  let ageAtDeath = $state(78);
  let hoverYear = $state<number | null>(null);

  // Keep the author alive at least until the work exists.
  $effect(() => {
    if (ageAtDeath < ageAtCreation) ageAtDeath = ageAtCreation;
  });

  const fill = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

  const usLaws = LAWS.filter((l) => l.jurisdiction === 'US');
  const anne = LAWS.find((l) => l.jurisdiction === 'GB')!;
  const term = (law: TermLaw) => termYears(law, kind, { ageAtCreation, ageAtDeath });
  const lawAt = (year: number) => [...usLaws].reverse().find((l) => l.year <= year)!;
  const endOf = (law: TermLaw) => {
    const next = usLaws[usLaws.indexOf(law) + 1];
    return next ? next.year - 1 : null;
  };

  // ---- Geometry (SVG user units; the SVG scales to its container) ----
  let width = $state(640);
  const W = $derived(Math.max(300, Math.round(width)));
  const H = $derived(W < 480 ? 260 : 300);
  const M = { top: 20, right: 64, bottom: 32, left: 44 };
  const X0 = 1700;
  const X1 = 2030;
  const plotW = $derived(W - M.left - M.right);
  const plotH = $derived(H - M.top - M.bottom);

  const yMax = $derived(Math.max(60, Math.ceil(Math.max(...usLaws.map(term)) / 20) * 20));
  const yStep = $derived(yMax > 120 ? 40 : 20);
  const yTicks = $derived(Array.from({ length: yMax / yStep + 1 }, (_, i) => i * yStep));
  const xTicks = $derived(
    plotW < 420 ? [1700, 1800, 1900, 2000] : [1700, 1750, 1800, 1850, 1900, 1950, 2000],
  );

  const x = $derived((year: number) => M.left + ((year - X0) / (X1 - X0)) * plotW);
  const y = $derived((years: number) => M.top + plotH - (years / yMax) * plotH);

  const path = $derived.by(() => {
    let d = `M${x(usLaws[0].year)},${y(term(usLaws[0]))}`;
    usLaws.forEach((law, i) => {
      if (i > 0) d += ` V${y(term(law))}`;
      const until = usLaws[i + 1]?.year ?? currentYear;
      d += ` H${x(until)}`;
    });
    return d;
  });

  const todayTerm = $derived(term(usLaws.at(-1)!));
  const firstTerm = $derived(term(usLaws[0]));

  // ---- Hover / focus readout ----
  const hoverLaw = $derived(hoverYear === null ? null : lawAt(hoverYear));
  const hoverX = $derived(hoverYear === null ? 0 : x(hoverYear));
  const tooltipLeft = $derived(`${(hoverX / W) * 100}%`);
  const tooltipFlip = $derived(hoverX / W > 0.6);

  function onPointerMove(event: PointerEvent) {
    const svg = (event.currentTarget as SVGRectElement).ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const year = Math.round(X0 + ((px - M.left) / plotW) * (X1 - X0));
    hoverYear = Math.min(currentYear, Math.max(usLaws[0].year, year));
  }

  const rangeLabel = (law: TermLaw) => {
    const end = endOf(law);
    return end === null
      ? fill(strings.inForceSince, { from: law.year })
      : fill(strings.inForce, { from: law.year, to: end });
  };
</script>

<div class="timeline">
  <div class="controls">
    <fieldset class="modes">
      <legend>{strings.kindLabel}</legend>
      <label>
        <input type="radio" name={`${uid}-kind`} value="author" bind:group={kind} />
        {strings.kindAuthor}
      </label>
      <label>
        <input type="radio" name={`${uid}-kind`} value="hire" bind:group={kind} />
        {strings.kindHire}
      </label>
    </fieldset>

    {#if kind === 'author'}
      <div class="sliders">
        <label for={`${uid}-created`}>
          <span>{strings.ageAtCreation}</span>
          <output for={`${uid}-created`}>{ageAtCreation}</output>
        </label>
        <input id={`${uid}-created`} type="range" min="15" max="80" bind:value={ageAtCreation} />
        <label for={`${uid}-death`}>
          <span>{strings.ageAtDeath}</span>
          <output for={`${uid}-death`}>{ageAtDeath}</output>
        </label>
        <input id={`${uid}-death`} type="range" min="20" max="100" bind:value={ageAtDeath} />
      </div>
    {/if}

    <p class="today" aria-live="polite">
      {fill(strings.todayResult, { n: todayTerm, year: currentYear + todayTerm })}
    </p>
  </div>

  <div class="chart" bind:clientWidth={width}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={fill(strings.chartLabel, { first: firstTerm, last: todayTerm })}
    >
      <!-- Grid and y axis -->
      {#each yTicks as tick (tick)}
        <line class="grid" x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} />
        <text class="tick" x={M.left - 8} y={y(tick)} dy="0.32em" text-anchor="end">{tick}</text>
      {/each}
      <text class="axis-label" x={M.left} y={M.top - 8}>{strings.axisLabel}</text>

      <!-- x axis -->
      {#each xTicks as tick (tick)}
        <text class="tick" x={x(tick)} y={H - M.bottom + 20} text-anchor="middle">{tick}</text>
      {/each}

      <!-- Statute of Anne, for comparison -->
      <circle class="dot dot-context" cx={x(anne.year)} cy={y(anne.fixed!)} r="4" />
      <text class="label" x={x(anne.year) - 4} y={y(anne.fixed!) + 20}>
        {strings.laws['1710'].name} · {fill(strings.yearsShort, { n: anne.fixed! })}
      </text>

      <!-- US term -->
      <path class="line" d={path} />
      <text class="label label-end" x={x(currentYear) + 8} y={y(todayTerm)} dy="0.32em">
        {fill(strings.yearsShort, { n: todayTerm })}
      </text>

      <!-- Crosshair -->
      {#if hoverLaw}
        <line class="crosshair" x1={hoverX} x2={hoverX} y1={M.top} y2={H - M.bottom} />
        <circle class="dot" cx={hoverX} cy={y(term(hoverLaw))} r="5" />
      {/if}

      <!-- Hit area for the crosshair -->
      <rect
        class="hit"
        x={M.left}
        y={M.top}
        width={plotW}
        height={plotH}
        onpointermove={onPointerMove}
        onpointerleave={() => (hoverYear = null)}
        role="presentation"
      />

      <!-- Law markers: focusable, same readout as hover -->
      {#each usLaws as law (law.year)}
        <circle
          class="dot marker"
          cx={x(law.year)}
          cy={y(term(law))}
          r="4"
          tabindex="0"
          role="img"
          aria-label={`${law.year}: ${strings.laws[law.key].name}, ${fill(strings.years, { n: term(law) })}`}
          onfocus={() => (hoverYear = law.year)}
          onblur={() => (hoverYear = null)}
        />
      {/each}
    </svg>

    {#if hoverLaw}
      <div class="tooltip" class:flip={tooltipFlip} style:left={tooltipLeft} aria-hidden="true">
        <strong>{fill(strings.years, { n: term(hoverLaw) })}</strong>
        <span>{strings.laws[hoverLaw.key].name}</span>
        <span class="muted">{rangeLabel(hoverLaw)}</span>
      </div>
    {/if}
  </div>

  <details class="data">
    <summary>{strings.tableToggle}</summary>
    <table>
      <thead>
        <tr>
          <th scope="col">{strings.colYear}</th>
          <th scope="col">{strings.colLaw}</th>
          <th scope="col">{strings.colRule}</th>
          <th scope="col">{strings.colTerm}</th>
        </tr>
      </thead>
      <tbody>
        {#each LAWS as law (law.year)}
          <tr>
            <td>{law.year}</td>
            <td>{strings.laws[law.key].name}</td>
            <td>{strings.laws[law.key].rule}</td>
            <td class="num">{fill(strings.years, { n: term(law) })}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </details>

  <p class="fineprint">
    {strings.note}
    {strings.sourcePrefix}
    <a href={strings.sourceUrl} rel="noopener">{strings.sourceName}</a>.
  </p>
</div>

<style>
  .timeline {
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
    margin: 0 0 var(--space-xs);
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

  .sliders {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3xs);
    max-width: 26rem;
  }

  .sliders label {
    display: flex;
    justify-content: space-between;
    gap: var(--space-s);
    margin-top: var(--space-2xs);
  }

  .sliders output {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .sliders input {
    width: 100%;
    accent-color: var(--color-accent);
  }

  .today {
    margin: var(--space-xs) 0 0;
    font-weight: 600;
  }

  .chart {
    position: relative;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .grid {
    stroke: var(--chart-grid);
    stroke-width: 1;
  }

  .tick,
  .axis-label,
  .label {
    fill: var(--color-text-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .label {
    fill: var(--color-text);
    font-size: 12px;
  }

  .label-end {
    font-weight: 700;
  }

  .line {
    fill: none;
    stroke: var(--chart-line);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .dot {
    fill: var(--chart-line);
    stroke: var(--color-surface);
    stroke-width: 2;
  }

  .dot-context {
    fill: var(--color-text-muted);
  }

  .marker {
    cursor: default;
  }

  .marker:focus-visible {
    outline: none;
    stroke: var(--color-focus);
    stroke-width: 3;
  }

  .crosshair {
    stroke: var(--color-text-muted);
    stroke-width: 1;
  }

  .hit {
    fill: transparent;
  }

  .tooltip {
    position: absolute;
    top: 0;
    transform: translateX(12px);
    display: grid;
    gap: 2px;
    min-width: 11rem;
    padding: var(--space-2xs) var(--space-xs);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
    pointer-events: none;
  }

  .tooltip.flip {
    transform: translateX(calc(-100% - 12px));
  }

  .tooltip strong {
    font-size: var(--step-0);
  }

  .muted {
    color: var(--color-text-muted);
  }

  .data summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--color-accent);
  }

  table {
    width: 100%;
    margin-top: var(--space-xs);
    border-collapse: collapse;
  }

  th,
  td {
    padding: var(--space-2xs);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
  }

  .num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .fineprint {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
</style>
