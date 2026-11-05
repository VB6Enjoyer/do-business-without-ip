<script lang="ts">
  import type { UIStrings } from '../../i18n/en';

  type Strings = UIStrings['tools']['selfCheck'];
  type Field = keyof Strings['fields'];
  type ReasonKey = keyof Strings['reasons'];

  let {
    strings,
    titles,
    base,
  }: {
    strings: Strings;
    /** Anchor id → title, for every place a suggestion can point to. */
    titles: Record<string, string>;
    /** URL of the guide page, so links work from anywhere. */
    base: string;
  } = $props();

  const uid = $props.id();
  const FIELDS = Object.keys(strings.fields) as Field[];

  /** Reading suggestions per field. */
  const FIELD_TARGETS: Record<Field, string[]> = {
    writing: ['publishing-and-copyright', 'dying-without-intellectual-property', 'release-tool'],
    music: ['music-without-intellectual-property', 'history', 'release-tool'],
    inventions: ['inventing-without-intellectual-property', 'patents', 'ip-contrarianism'],
    software: ['history', 'patents', 'steps-you-can-take-now'],
    business: ['steps-you-can-take-now', 'ip-contrarianism', 'but-while-ip-exists-'],
  };

  /** Answer options per question: the first four are yes/no; the last two are either/or. */
  const options = [0, 1, 2, 3].map(() => [
    { value: 'yes', label: strings.answers.yes },
    { value: 'unsure', label: strings.answers.unsure },
    { value: 'no', label: strings.answers.no },
  ]);
  options.push(
    [
      { value: 'merits', label: strings.q5Options.merits },
      { value: 'unsure', label: strings.q5Options.unsure },
      { value: 'state', label: strings.q5Options.state },
    ],
    [
      { value: 'free', label: strings.q6Options.free },
      { value: 'unsure', label: strings.q6Options.unsure },
      { value: 'ip', label: strings.q6Options.ip },
    ],
  );

  /** What each answer suggests reading, if anything. */
  function questionTarget(i: number, answer: string): [string, ReasonKey] | null {
    const doubtful = answer === 'yes' || answer === 'unsure';
    switch (i) {
      case 0:
        return doubtful ? ['steps-you-can-take-now', 'dependOnIp'] : null;
      case 1:
        return doubtful ? ['ip-contrarianism', 'customers'] : null;
      case 2:
        return doubtful ? ['patents', 'legalFees'] : null;
      case 3:
        return answer === 'yes'
          ? ['contrary-to-free-markets', 'freeMarketsYes']
          : ['ip-versus-property-rights', 'freeMarketsNo'];
      case 4:
        return answer === 'merits' ? null : ['should-we-abolish-ip', 'stateProtection'];
      case 5:
        return answer === 'free'
          ? null
          : ['inventing-without-intellectual-property', 'flexibility'];
      default:
        return null;
    }
  }

  let fields = $state<Field[]>([]);
  let answers = $state<(string | null)[]>([null, null, null, null, null, null]);

  const suggestions = $derived.by(() => {
    const out = new Map<string, Set<string>>();
    const add = (slug: string, reason: string) => {
      if (!titles[slug]) return;
      if (!out.has(slug)) out.set(slug, new Set());
      out.get(slug)!.add(reason);
    };
    for (const field of fields) {
      for (const slug of FIELD_TARGETS[field]) add(slug, strings.reasons[field]);
    }
    answers.forEach((answer, i) => {
      if (!answer) return;
      const target = questionTarget(i, answer);
      if (target) add(target[0], strings.reasons[target[1]]);
    });
    return [...out].map(([slug, reasons]) => ({
      slug,
      title: titles[slug],
      reasons: [...reasons],
    }));
  });

  function clear() {
    fields = [];
    answers = [null, null, null, null, null, null];
  }
</script>

<div class="self-check">
  <fieldset class="fields">
    <legend>{strings.fieldLegend}</legend>
    <div class="chips">
      {#each FIELDS as field (field)}
        <label class="chip">
          <input type="checkbox" value={field} bind:group={fields} />
          {strings.fields[field]}
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="questions">
    <legend>{strings.questionsLegend}</legend>
    <ol>
      {#each strings.questions as question, i (i)}
        <li>
          <fieldset class="question">
            <legend>{question}</legend>
            <div class="segmented">
              {#each options[i] as option (option.value)}
                <label>
                  <input
                    type="radio"
                    name={`${uid}-q${i}`}
                    value={option.value}
                    bind:group={answers[i]}
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </fieldset>
        </li>
      {/each}
    </ol>
  </fieldset>

  <section class="results" aria-live="polite" aria-labelledby={`${uid}-results`}>
    <h4 id={`${uid}-results`}>{strings.readNext}</h4>
    {#if suggestions.length === 0}
      <p class="empty">{strings.empty}</p>
    {:else}
      <ul>
        {#each suggestions as s (s.slug)}
          <li>
            <a href={`${base}#${s.slug}`}>{s.title}</a>
            <span class="why">{s.reasons.join(' · ')}</span>
          </li>
        {/each}
      </ul>
      <button type="button" onclick={clear}>{strings.clear}</button>
    {/if}
  </section>
</div>

<style>
  .self-check {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-m);
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
    font-weight: 600;
  }

  .fields > legend,
  .questions > legend {
    margin-bottom: var(--space-2xs);
  }

  .chips,
  .segmented {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }

  .chip,
  .segmented label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-3xs) var(--space-s);
    min-height: 2.25rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    cursor: pointer;
  }

  .chip:has(input:checked),
  .segmented label:has(input:checked) {
    border-color: var(--color-accent);
    background: var(--color-highlight);
    font-weight: 600;
  }

  .chip:has(input:focus-visible),
  .segmented label:has(input:focus-visible) {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  input {
    accent-color: var(--color-accent);
  }

  ol {
    display: grid;
    gap: var(--space-s);
    margin: 0;
    padding-inline-start: 1.4em;
  }

  .question legend {
    font-weight: 500;
    margin-bottom: var(--space-2xs);
    line-height: 1.4;
  }

  .results {
    padding: var(--space-s) var(--space-m);
    border-radius: var(--radius-m);
    background: var(--color-highlight);
  }

  .results h4 {
    margin: 0 0 var(--space-2xs);
    font-size: var(--step--1);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .results ul {
    margin: 0 0 var(--space-s);
    padding-inline-start: 1.1em;
  }

  .results li {
    margin-bottom: var(--space-2xs);
  }

  .results a {
    font-weight: 600;
  }

  .why {
    display: block;
    color: var(--color-text-muted);
  }

  .empty {
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
</style>
