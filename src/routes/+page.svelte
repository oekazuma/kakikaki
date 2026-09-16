<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { practiceUrl } from '$lib/nav';
  import { logoUrl } from '$lib/image';
  import { fly } from 'svelte/transition';
  import WordCard from '$lib/components/WordCard.svelte';
  import ContinueCard from '$lib/components/ContinueCard.svelte';
  import KanjiGrid from '$lib/components/KanjiGrid.svelte';
  import JumpBar from '$lib/components/JumpBar.svelte';
  import { imageUrl } from '$lib/image';
  import { WORDS, CATEGORIES } from '$lib/words';
  import { unlock } from '$lib/audio';
  import Icon from '$lib/components/Icon.svelte';
  import ProgressCard from '$lib/components/ProgressCard.svelte';
  import { badgesOf, TOTAL } from '$lib/badges';
  import { stats } from '$lib/progress.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import LangToggle from '$lib/components/LangToggle.svelte';
  import ProfileButton from '$lib/components/ProfileButton.svelte';
  import { updated } from '$app/state';
  const s = $derived(stats());
  const total = $derived(TOTAL(lang.v));
  const badgeCount = $derived(badgesOf(lang.v).length);
  const kanji = $derived(lang.v === 'kanji');
  // カテゴリの飛び先バー。文字が読めない子にも分かるよう、各カテゴリ先頭の絵を目印にする
  const cats = CATEGORIES.map((c) => ({ id: c, label: c, image: imageUrl(WORDS.find((w) => w.category === c)!) }));
</script>

<svelte:head>
  <title>{info().title}</title>
  <meta
    name="description"
    content="iPad で遊ぶ、子ども向けのひらがな・カタカナ・漢字・英語の書き練習アプリ。すきな単語をえらんで、なぞって、じぶんで書いて、星とメダルをあつめよう。"
  />
</svelte:head>

<main in:fly={{ x: -40, duration: 250 }}>
  <header>
    {#key lang.v}
      <h1 in:fly={{ y: -16, duration: 300 }}>
        <img src={logoUrl(lang.v)} alt="" width="52" height="52" loading="eager" /><span class="kaki">かきかき</span>
        <span class="hira">{info().short}</span>
      </h1>
    {/key}
    <ProfileButton />
    <LangToggle />
    <nav>
      <ProgressCard {s} {total} {badgeCount} />
      <a class="card btn quiz" href={resolve('/quiz')}><Icon name="bulb" size={22} /> クイズ</a>
      <a class="card btn" href={resolve('/chars')}>{kanji ? 'よみから さがす' : 'もじから えらぶ'}</a>
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
      {#if kanji}
        <ContinueCard />
        <KanjiGrid jump />
      {:else}
        <JumpBar items={cats} label="カテゴリへ とぶ" />
        <ContinueCard />
        {#each CATEGORIES as cat (cat)}
          <h2 id={cat}>{cat}</h2>
          <div class="row">
            {#each WORDS.filter((w) => w.category === cat) as w, n (w.id)}
              <WordCard
                word={w}
                size={150}
                fill
                lazy={cat !== CATEGORIES[0] || n >= 7}
                onclick={() => {
                  unlock();
                  goto(practiceUrl(w.id));
                }}
              />
            {/each}
          </div>
        {/each}
      {/if}
    </div>
  {/key}
</main>

<style>
  main {
    padding: 20px 28px 40px;
    min-height: calc(100vh - var(--sat) - var(--sab));
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
  /* iPad（〜1240。mini は 1133、旧型は 1024）では 4 ことば のトグルぶん足りず 2 段になるので、余白と隙間を詰めて 1 行に保つ */
  @media (max-width: 1240px) {
    header,
    nav {
      gap: 8px;
    }
    .btn {
      padding: 12px 10px;
    }
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
    background: var(--danger);
    border: 3px solid var(--bg);
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      transform: scale(1.25);
    }
  }
  /* 150px 以上のマスで幅いっぱいに並べる（iPad mini で右に大きな余白が残らないように） */
  /* 右端の飛び先バーぶん空ける。見出しはステータスバーの下に入らない位置へ飛ぶ */
  .words {
    margin-right: 64px;
  }
  .words h2 {
    scroll-margin-top: calc(var(--sat) + 8px);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 6px 0 10px;
  }
</style>
