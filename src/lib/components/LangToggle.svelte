<script lang="ts">
  import { lang, setLang, info, LANGS } from '$lib/lang.svelte';
  const GLYPH = { ja: 'あ', kana: 'ア', en: 'A' } as const;
</script>

<div class="toggle card" role="tablist" aria-label="ことばを えらぶ">
  <span class="knob" style:--i={LANGS.indexOf(lang.v)}></span>
  {#each LANGS as l (l)}
    <button role="tab" aria-selected={lang.v === l} class={{ on: lang.v === l }} onclick={() => setLang(l)}>
      {GLYPH[l]} <small>{info(l).short}</small>
    </button>
  {/each}
</div>

<style>
  .toggle {
    position: relative;
    display: flex;
    padding: 4px;
    border-radius: 30px;
    margin-left: auto;
    --step: 88px;
  }
  .toggle button {
    position: relative;
    z-index: 1;
    width: var(--step);
    height: 48px;
    border-radius: 26px;
    font-size: 22px;
    font-weight: bold;
    color: var(--sub);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: color 0.3s;
  }
  .toggle button small {
    font-size: 12px;
    white-space: nowrap;
  }
  .toggle .on {
    color: #fff;
  }
  .knob {
    position: absolute;
    top: 4px;
    left: 4px;
    width: var(--step);
    height: 48px;
    border-radius: 26px;
    background: var(--blue);
    transform: translateX(calc(var(--i) * var(--step)));
    transition:
      transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1),
      background-color 0.4s;
  }
  /* 幅 1024 の iPad ではトグルを文字だけにする */
  @media (max-width: 1130px) {
    .toggle {
      --step: 56px;
    }
    .toggle button small {
      display: none;
    }
  }
</style>
