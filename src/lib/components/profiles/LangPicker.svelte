<script lang="ts">
  import Icon from '../Icon.svelte';
  import { LANGS, info, type Lang } from '$lib/lang.svelte';
  // 消すことばをチェックで選ぶ
  let { langs = $bindable() }: { langs: Lang[] } = $props();
  const GLYPH: Record<Lang, string> = { ja: 'あ', kana: 'ア', en: 'A' };
  const all = $derived(langs.length === LANGS.length);
  const toggle = (l: Lang) => (langs = LANGS.filter((x) => (x === l ? !langs.includes(l) : langs.includes(x))));
</script>

<div class="langs">
  {#each LANGS as l (l)}
    <button class={['lg', { on: langs.includes(l) }]} aria-pressed={langs.includes(l)} onclick={() => toggle(l)}>
      <span class="box"
        >{#if langs.includes(l)}<Icon name="check" size={18} />{/if}</span
      >
      <span class="glyph">{GLYPH[l]}</span>
      {info(l).short}
    </button>
  {/each}
  <button class="all" onclick={() => (langs = all ? [] : [...LANGS])}>{all ? 'ぜんぶ はずす' : 'ぜんぶ えらぶ'}</button>
</div>

<style>
  .langs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .lg {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    border: 3px solid #e3e8ee;
    background: #fff;
    font-weight: bold;
    font-size: 16px;
  }
  .lg.on {
    border-color: #e08a00;
    background: #fff5e0;
  }
  .box {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 2px solid #c9d1d9;
    display: grid;
    place-content: center;
    background: #fff;
  }
  .lg.on .box {
    background: #e08a00;
    border-color: #e08a00;
    color: #fff;
  }
  .glyph {
    font-size: 20px;
    color: var(--blue);
  }
  .all {
    grid-column: 1 / -1;
    justify-self: end;
    color: var(--blue);
    font-weight: bold;
    text-decoration: underline;
    background: none;
    font-size: 14px;
  }
</style>
