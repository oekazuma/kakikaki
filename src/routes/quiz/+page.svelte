<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { info } from '$lib/lang.svelte';
  import { quiz } from '$lib/progress.svelte';
  import { LEVEL_NAME, QUESTIONS, type Kind, type Level } from '$lib/quiz';

  const KINDS: { id: Kind; icon: 'eye' | 'pencil'; name: string; desc: string }[] = [
    { id: 'read', icon: 'eye', name: 'よみクイズ', desc: 'もじを よんで えを えらぼう' },
    { id: 'write', icon: 'pencil', name: 'かきクイズ', desc: 'えを みて もじを かこう' }
  ];
  const LEVELS: { lv: Level; hint: string }[] = [
    { lv: 1, hint: 'みじかい ことば' },
    { lv: 2, hint: 'ふつうの ことば' },
    { lv: 3, hint: 'ながい ことば' }
  ];
</script>

<svelte:head>
  <title>クイズ | {info().title}</title>
  <meta name="description" content="よみクイズ・かきクイズを かんたん・ふつう・むずかしい から選ぶページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1><Icon name="bulb" /> クイズ <small>（{info().short}）</small></h1>
  </header>
  <div class="kinds">
    {#each KINDS as k (k.id)}
      <section class="card">
        <div class="kh">
          <span class="ki"><Icon name={k.icon} size={34} /></span>
          <div>
            <h2>{k.name}</h2>
            <p>{k.desc}（{QUESTIONS[k.id]} もん）</p>
          </div>
        </div>
        <div class="levels">
          {#each LEVELS as { lv, hint } (lv)}
            <a class={['lv', `l${lv}`]} href="{resolve(`/quiz/${k.id}`)}?level={lv}">
              <span class="stars">{'★'.repeat(lv)}</span>
              <span class="name">{LEVEL_NAME[lv]}<small>{hint}</small></span>
              <span class="n">せいかい<b>{quiz()[`${k.id}${lv}`] ?? 0}</b></span>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 14px;
    height: calc(100vh - var(--sat) - var(--sab));
    padding: 16px 22px 20px;
  }
  header {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h1 :global(svg) {
    color: var(--warn);
  }
  h1 small {
    font-size: 14px;
    color: var(--sub);
  }
  .kinds {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    min-height: 0;
  }
  section {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 14px;
    padding: 20px 22px;
    min-height: 0;
  }
  .kh {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .ki {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: var(--blue);
    color: #fff;
    display: grid;
    place-content: center;
    flex: none;
  }
  h2 {
    margin: 0;
    font-size: 28px;
  }
  p {
    margin: 2px 0 0;
    color: var(--sub);
    font-size: 14px;
  }
  .levels {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 12px;
    min-height: 0;
  }
  .lv {
    display: grid;
    grid-template-columns: 90px 1fr auto;
    align-items: center;
    gap: 14px;
    padding: 0 24px;
    border-radius: 22px;
    text-decoration: none;
    color: #fff;
    transition: transform 0.15s;
  }
  .lv:active {
    transform: scale(0.97);
  }
  .l1 {
    background: #4caf50;
  }
  .l2 {
    background: #3f87d6;
  }
  .l3 {
    background: #ef6c30;
  }
  .stars {
    font-size: 26px;
    color: var(--star);
    letter-spacing: 2px;
  }
  .name {
    font-size: 30px;
    font-weight: bold;
    display: grid;
  }
  .name small {
    font-size: 13px;
    font-weight: normal;
    opacity: 0.9;
  }
  .n {
    display: grid;
    justify-items: center;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.22);
    padding: 6px 14px;
    border-radius: 14px;
    min-width: 80px;
  }
  .n b {
    font-size: 22px;
  }
</style>
