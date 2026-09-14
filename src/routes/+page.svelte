<script lang="ts">
  import { goto } from '$app/navigation';
  import { base, resolve } from '$app/paths';
  import { practiceUrl } from '$lib/nav';
  import { fly } from 'svelte/transition';
  import WordCard from '$lib/components/WordCard.svelte';
  import { WORDS, CATEGORIES } from '$lib/words';
  import { unlock } from '$lib/audio';
  import Bar from '$lib/components/Bar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { badgesOf, TOTAL } from '$lib/badges';
  import { earned, stats } from '$lib/progress.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import LangToggle from '$lib/components/LangToggle.svelte';
  import ProfileButton from '$lib/components/ProfileButton.svelte';
  import { updated } from '$app/state';
  const s = $derived(stats());
  const total = $derived(TOTAL(lang.v));
  const badgeCount = $derived(badgesOf(lang.v).length);
</script>

<svelte:head>
  <title>{info().title}</title>
  <meta
    name="description"
    content="iPad で遊ぶ、子ども向けのひらがな書き練習アプリ。すきな単語をえらんで、なぞって、じぶんで書いて、星とメダルをあつめよう。"
  />
</svelte:head>

<main in:fly={{ x: -40, duration: 250 }}>
  <header>
    {#key lang.v}
      <h1 in:fly={{ y: -16, duration: 300 }}>
        <img
          src="{base}/logo-mark{lang.v === 'ja' ? '' : `-${lang.v}`}.svg"
          alt=""
          width="52"
          height="52"
          loading="eager"
        /><span class="kaki">かきかき</span>
        <span class="hira">{info().short}</span>
      </h1>
    {/key}
    <ProfileButton />
    <LangToggle />
    <nav>
      <a class="card prog" href={resolve('/trophies')}>
        <span class="tr"><Icon name="trophy" size={22} /> {Object.keys(earned()).length} / {badgeCount}</span>
        <span class="pl">もじ {s.chars}/{total.chars}<Bar have={s.chars} need={total.chars} /></span>
        <span class="pl"
          >たんご {s.words}/{total.words}<Bar have={s.words} need={total.words} color="var(--teal)" /></span
        >
      </a>
      <a class="card btn quiz" href={resolve('/quiz')}><Icon name="bulb" size={22} /> クイズ</a>
      <a class="card btn" href={resolve('/chars')}>もじから えらぶ</a>
      <a
        class="card btn help"
        href={resolve('/about')}
        aria-label={updated.current ? 'アプリについて（あたらしい バージョンが あります）' : 'アプリについて'}
      >
        <Icon name="help" size={22} />
        {#if updated.current}<span class="dot"></span>{/if}
      </a>
    </nav>
  </header>
  {#key lang.v}
    <div class="words" in:fly={{ x: 80, duration: 350 }}>
      {#each CATEGORIES as cat (cat)}
        <h2>{cat}</h2>
        <div class="row">
          {#each WORDS.filter((w) => w.category === cat) as w, n (w.id)}
            <WordCard
              word={w}
              size={150}
              lazy={cat !== CATEGORIES[0] || n >= 7}
              onclick={() => {
                unlock();
                goto(practiceUrl(w.id));
              }}
            />
          {/each}
        </div>
      {/each}
    </div>
  {/key}
</main>

<style>
  main {
    padding: 20px 28px 40px;
    min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
  header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  h1 {
    font-size: 26px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    flex: none;
  }
  h1 img {
    width: 52px;
    height: 52px;
  }
  .kaki {
    color: var(--blue);
  }
  .hira {
    color: var(--teal);
  }
  h2 {
    font-size: 18px;
    color: var(--sub);
    margin: 22px 0 8px;
  }
  nav {
    display: flex;
    gap: 10px;
    white-space: nowrap;
  }
  .prog {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    text-decoration: none;
    font-size: 13px;
    font-weight: bold;
    color: var(--ink);
  }
  .pl {
    display: grid;
    gap: 3px;
    width: 96px;
    font-size: 11px;
    color: var(--sub);
  }
  .tr {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #e08a00;
  }
  .btn.quiz {
    gap: 6px;
  }
  .btn {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    font-weight: bold;
    text-decoration: none;
    color: var(--teal);
  }
  .help {
    position: relative;
  }
  /* 新しいバージョンがあるときの赤丸 */
  .dot {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #e53935;
    border: 3px solid var(--bg);
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      transform: scale(1.25);
    }
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 6px 0 10px;
  }
  /* iPad Pro 12.9（1366）や名前 6 文字でも 1 行に収める。進捗バーは実績画面にもあるので省略 */
  @media (max-width: 1500px) {
    .pl {
      display: none;
    }
  }
</style>
