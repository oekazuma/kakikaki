<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { practiceUrl } from '$lib/nav';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import Canvas from '$lib/components/Canvas.svelte';
  import type { Result } from '$lib/tracer.svelte';
  import WordCard from '$lib/components/WordCard.svelte';
  import Stars from '$lib/components/Stars.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import { WORDS, wordById } from '$lib/words';
  import { goto } from '$app/navigation';
  import { imageUrl } from '$lib/image';
  import { get, record, charCleared, wordStar, wordCrown, checkBadges, type Mode } from '$lib/progress.svelte';
  import { lang, info, nameOf, lettersOf, strokesOf, charsOf } from '$lib/lang.svelte';
  import type { Badge } from '$lib/badges';
  import type { Word } from '$lib/words';
  import { say, sfx, readingOf } from '$lib/audio';
  import { fx } from '$lib/fx';
  import { stars, praise } from '$lib/score';

  const word = $derived(wordById(page.url.searchParams.get('w') ?? '') ?? wordById('patocar')!);
  const chars = $derived(lettersOf(word));
  const strokes = $derived(strokesOf());
  // その文字で次にやるべきモード。全部終わっていれば null
  function nextMode(ch: string): Mode | null {
    const p = get(ch);
    return p.trace < 2 ? 'trace' : p.free < 1 ? 'free' : p.test < 1 ? 'test' : null;
  }
  // 左から順に解放: 前の文字がクリア済みなら選べる
  const unlocked = (n: number) => n === 0 || charCleared(chars[n - 1]);
  // 最初はまだ終わっていない最初の文字から
  let i = $state(
    untrack(() =>
      Math.max(
        0,
        chars.findIndex((ch) => nextMode(ch) !== null)
      )
    )
  );
  const c = $derived(chars[i]);
  let mode = $state<Mode>(untrack(() => nextMode(chars[i])) ?? 'trace');
  let gen = $state(0); // 同じ文字・モードで書き取り面を作り直すためのカウンタ
  let drawn = $state(false); // おてほんなしで 1 画以上書いた
  let canvas = $state<Canvas>();
  let stroke = $state(0);
  let msg = $state('');
  let flyStar = $state(false);
  let drive = $state(false);
  let busy = $state(false);
  let toast = $state<Badge | null>(null);
  let complete = $state(false); // 単語の全文字が終わった
  let shaking = $state(-1); // 鍵つきタブを押したとき横に揺らす
  function tapTab(n: number) {
    if (unlocked(n)) return select(n);
    shaking = -1;
    requestAnimationFrame(() => (shaking = n));
    sfx.buu();
  }
  let speaking = $state(false);
  async function hear() {
    speaking = true;
    await say([lang.v === 'en' ? c : readingOf(c), ...(chars.length > 1 ? [nameOf(word)] : [])], info().speech);
    speaking = false;
  }

  // 単語が切り替わったら（つぎの たんご など）まだ終わっていない最初の文字から。
  // 完了モーダルは初めて終えた瞬間だけ出すので、済んだ単語を開き直しても出さない
  $effect(() => {
    void word.id;
    untrack(() => {
      complete = false;
      select(
        Math.max(
          0,
          chars.findIndex((ch) => nextMode(ch) !== null)
        )
      );
    });
  });

  // まだ終わっていない次の単語（同じ並び順で後ろから探し、末尾なら先頭へ）。全部終わっていれば null
  const wordDone = (w: Word) => lettersOf(w).every((ch) => nextMode(ch) === null);
  function nextId(): string | null {
    if (word.id.startsWith('char-')) {
      const list = charsOf();
      const k = list.indexOf(word.name);
      for (let n = 1; n < list.length; n++) {
        const ch = list[(k + n) % list.length];
        if (nextMode(ch) !== null) return `char-${ch}`;
      }
      return null;
    }
    const k = WORDS.findIndex((w) => w.id === word.id);
    for (let n = 1; n < WORDS.length; n++) {
      const w = WORDS[(k + n) % WORDS.length];
      if (!wordDone(w)) return w.id;
    }
    return null;
  }
  function goNext() {
    complete = false;
    const id = nextId();
    goto(id ? practiceUrl(id) : resolve('/'));
  }
  function replay() {
    complete = false;
    select(0, 'trace');
  }

  function showBadges(list: Badge[], delay: number) {
    list.forEach((b, k) => {
      setTimeout(
        () => {
          toast = b;
          fx.confetti(150);
          sfx.fanfare();
          setTimeout(() => (toast = null), 2400);
        },
        delay + k * 2600
      );
    });
  }

  const MODES: { id: Mode; icon: 'trace' | 'pencil' | 'star'; label: string; hint: string; title: string }[] = [
    {
      id: 'trace',
      icon: 'trace',
      label: 'なぞる',
      hint: 'の まるから みちに そって ゆっくり',
      title: 'なぞって みよう！'
    },
    {
      id: 'free',
      icon: 'pencil',
      label: 'じぶんで かく',
      hint: 'いろの みちを ぬろう。なんかいに わけても いいよ',
      title: 'じぶんで かいてみよう！'
    },
    {
      id: 'test',
      icon: 'star',
      label: 'おてほんなし',
      hint: 'おてほんを みないで かいてみよう',
      title: 'おてほんなしで かいてみよう！'
    }
  ];
  const cur = $derived(MODES.find((m) => m.id === mode)!);

  function select(n: number, m: Mode = nextMode(chars[n]) ?? 'trace') {
    if (!unlocked(n)) return;
    i = n;
    mode = m;
    stroke = 0;
    msg = '';
    drawn = false;
    gen++;
  }

  function done(r: Result) {
    if (busy) return;
    if (r.mode === 'test' && !r.ok) {
      msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      sfx.buu();
      return;
    }
    busy = true;
    const wasC = charCleared(c),
      wasW = wordStar(word);
    record(c, r.mode);
    const st = r.mode === 'trace' ? 3 : stars(r.score);
    msg = r.mode === 'trace' ? 'できた！' : `${'★'.repeat(st)} ${praise(st)}`;
    sfx.kira();
    if (!wasC && charCleared(c)) {
      fx.confetti(120);
      flyStar = true;
      setTimeout(() => (flyStar = false), 900);
    }
    let wait = 1200;
    if (!wasW && wordStar(word)) {
      wait = 2600;
      setTimeout(() => {
        drive = true;
        fx.confetti(300);
        sfx.fanfare();
      }, 600);
      setTimeout(() => (drive = false), 2600);
    }
    const fresh = checkBadges();
    if (fresh.length) {
      showBadges(fresh, wait);
      wait += fresh.length * 2600;
    }
    setTimeout(() => {
      busy = false;
      const next = nextMode(c);
      if (next) select(i, next);
      else if (i < chars.length - 1) select(i + 1);
      else complete = true;
    }, wait);
  }
</script>

<svelte:head>
  <title>{nameOf(word)} を かく | {info().title}</title>
  <meta
    name="description"
    content="「{nameOf(word)}」の文字を なぞる・じぶんで かく・おてほんなし で練習するページ。"
  />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>{cur.title}</h1>
  </header>

  <div class="left">
    <WordCard {word} size={240} />
    <div class={['tabs', { compact: chars.length > 6 }]}>
      {#each chars as ch, n (n + ch)}
        {@const lock = !unlocked(n)}
        <button
          class={['tab', 'card', { on: n === i, lock, done: charCleared(ch), shake: shaking === n }]}
          aria-disabled={lock}
          onclick={() => tapTab(n)}
          onanimationend={() => (shaking = -1)}
        >
          <span class="ch">{ch}</span>
          <span class={['s', { gold: get(ch).test > 0 }]}>
            {#if lock}<Icon name="lock" size={14} />{:else if get(ch).test > 0}<Icon
                name="crown"
                size={14}
                fill
              />{:else if charCleared(ch)}<Icon name="star" size={14} fill />{/if}
          </span>
        </button>
      {/each}
    </div>
    <div class="charstars card">
      <div class="row"><span>なぞる</span><Stars n={2} k={get(c).trace} size={20} /></div>
      <div class="row"><span>じぶんで かく</span><Stars n={1} k={get(c).free} size={20} /></div>
      <div class="row gold"><span>おてほんなし</span><Stars n={1} k={get(c).test} size={20} /></div>
    </div>
  </div>

  <section class="center">
    <div class="modes card">
      {#each MODES as m (m.id)}
        <button class={{ on: mode === m.id }} onclick={() => select(i, m.id)}
          ><Icon name={m.icon} size={20} /> {m.label}</button
        >
      {/each}
    </div>
    <div class="board card">
      <span class="count">{Math.min(stroke + 1, strokes[c].length)} / {strokes[c].length}</span>
      {#key `${lang.v}-${c}-${mode}-${gen}`}
        <Canvas
          bind:this={canvas}
          char={c}
          {strokes}
          {mode}
          onDone={done}
          onStroke={(k) => (stroke = k + 1)}
          onDraw={() => (drawn = true)}
        />
      {/key}
      {#if flyStar}<div class="flystar"><Icon name="star" size={90} fill /></div>{/if}
    </div>
    <p class="hint">
      {#if msg}
        {msg}
      {:else if mode === 'trace'}
        <span class="num">{Math.min(stroke + 1, strokes[c].length)}</span>{cur.hint}
      {:else if mode === 'test' && drawn}
        かけたら みぎの「できた」を おしてね
      {:else}
        {cur.hint}
      {/if}
    </p>
  </section>

  <div class="right">
    <button class={['rb', { speaking }]} onclick={hear}
      ><span class="card ic"><Icon name="speaker" size={32} /></span>きく</button
    >
    <button class="rb" onclick={() => select(i, mode)}
      ><span class="card ic"><Icon name="redo" size={32} /></span>やりなおす</button
    >
    {#if mode === 'test'}
      <button class={['rb', 'done', { ready: drawn }]} onclick={() => canvas?.judge()}
        ><span class="card ic"><Icon name="check" size={36} /></span>できた</button
      >
    {/if}
  </div>

  {#if drive}
    <img
      class="drive"
      src={imageUrl(word)}
      alt=""
      width="280"
      height="200"
      loading="eager"
      onerror={() => (drive = false)}
    />
  {/if}
  {#if complete}
    <div class="complete card" in:fly={{ y: 40, duration: 350 }}>
      <img
        src={imageUrl(word)}
        alt=""
        width="170"
        height="120"
        loading="eager"
        onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
      />
      <b class="cname">{nameOf(word)}</b>
      <p>ぜんぶ できた！</p>
      <div class="marks">
        {#if wordCrown(word)}<span class="mark gold"><Icon name="crown" size={22} fill /> おうかん</span>{:else}<span
            class="mark"><Icon name="star" size={22} fill /> ほし ゲット</span
          >{/if}
      </div>
      <div class="btns">
        <button class="next" onclick={goNext}>{word.id.startsWith('char-') ? 'つぎの もじ' : 'つぎの たんご'}</button>
        <a class="home" href={resolve('/')}>ホームへ</a>
        <button class="again" onclick={replay}>もういちど</button>
      </div>
    </div>
  {/if}
  {#if toast}
    <div class="toast card" transition:fly={{ y: -80, duration: 400 }}>
      <span class="tem">{toast.emoji}</span>
      <div><small>めだる ゲット！</small><b>{toast.name}</b></div>
    </div>
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 240px 1fr 120px;
    grid-template-rows: auto 1fr;
    gap: 14px 22px;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    padding: 16px 22px;
  }
  header {
    grid-column: 1 / -1;
    display: flex;
    gap: 14px;
    align-items: center;
  }
  h1 {
    margin: 0;
    font-size: 22px;
  }
  /* 左カラムは高さを超えても画面全体を伸ばさず、内部でスクロールする */
  .left {
    display: grid;
    gap: 20px;
    align-content: start;
    min-height: 0;
    overflow-y: auto;
    padding: 2px;
  }
  .tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    --tab: 62px;
    --tabh: 68px;
    --tabf: 30px;
  }
  /* 7 文字以上は小さめにして 4 列で収める */
  .tabs.compact {
    gap: 7px;
    --tab: 52px;
    --tabh: 58px;
    --tabf: 24px;
  }
  .tab {
    width: var(--tab);
    height: var(--tabh);
    display: grid;
    grid-template-rows: 1fr 16px;
    justify-items: center;
    align-items: center;
    padding: 6px 0 4px;
    font-size: var(--tabf);
    font-weight: bold;
    border: 3px solid transparent;
  }
  .tab.done {
    background: #fff8dc;
  }
  .tab.on {
    background: var(--blue);
    color: #fff;
    border-color: var(--dark);
  }
  .tab.lock {
    background: #e9ecef;
    color: #b0b7bf;
    box-shadow: none;
  }
  .tab .s {
    display: grid;
    color: var(--star);
  }
  .tab .s.gold {
    color: #e08a00;
  }
  .tab.on .s {
    color: #fff;
  }
  .tab.lock .s {
    color: #b0b7bf;
  }
  .tab.shake {
    animation: tabshake 0.4s;
  }
  @keyframes tabshake {
    20%,
    60% {
      transform: translateX(-7px);
    }
    40%,
    80% {
      transform: translateX(7px);
    }
  }
  .charstars {
    padding: 12px 18px;
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: bold;
    color: var(--sub);
  }
  .row.gold :global(.on) {
    color: #e08a00;
  }
  .center {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 10px;
    min-height: 0;
  }
  .modes {
    display: flex;
    padding: 4px;
  }
  .modes button {
    flex: 1;
    padding: 10px;
    border-radius: 16px;
    font-weight: bold;
    color: var(--sub);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .modes .on {
    background: var(--teal);
    color: #fff;
  }
  .board {
    position: relative;
    min-height: 0;
    padding: 12px;
  }
  .count {
    position: absolute;
    top: 10px;
    left: 14px;
    font-size: 13px;
    color: var(--sub);
    background: #eef1f4;
    padding: 4px 10px;
    border-radius: 12px;
  }
  .hint {
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 22px;
    border-radius: 20px;
    background: #fff;
    color: var(--ink);
    font-size: 18px;
    min-height: 40px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  /* 書き取り面の番号つきの丸と同じ見た目 */
  .num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    display: grid;
    place-content: center;
    font-size: 17px;
  }
  .right {
    display: grid;
    gap: 26px;
    align-content: center;
    justify-items: center;
  }
  .rb {
    display: grid;
    justify-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: bold;
    color: var(--sub);
  }
  .ic {
    width: 68px;
    height: 68px;
    display: grid;
    place-content: center;
    color: var(--blue);
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  /* 押したことが分かるように沈める */
  .rb:active .ic {
    transform: scale(0.9);
    background: #dfe7f0;
  }
  /* 読み上げ中は点灯 */
  .speaking .ic {
    background: var(--blue);
    color: #fff;
    animation: glow 1s ease-in-out infinite;
  }
  .speaking {
    color: var(--blue);
  }
  @keyframes glow {
    50% {
      box-shadow: 0 0 0 8px rgba(79, 124, 174, 0.25);
    }
  }
  .done .ic {
    background: var(--teal);
    width: 76px;
    height: 76px;
    color: #fff;
  }
  .done:active .ic {
    background: #0f5f58;
  }
  .done {
    font-weight: bold;
    color: var(--teal);
  }
  .done.ready .ic {
    animation: ready 1s ease-in-out infinite;
    box-shadow: 0 0 0 6px rgba(19, 120, 111, 0.25);
  }
  @keyframes ready {
    50% {
      transform: scale(1.12);
    }
  }
  .flystar {
    position: absolute;
    left: 50%;
    top: 50%;
    color: var(--star);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    animation: fly 0.9s ease-in forwards;
    pointer-events: none;
  }
  @keyframes fly {
    0% {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 0;
    }
    30% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% - 60vw), calc(-50% + 10vh)) scale(0.2);
      opacity: 0;
    }
  }
  .complete {
    position: fixed;
    inset: 0;
    margin: auto;
    width: 520px;
    height: 400px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 8px;
    z-index: 80;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  .complete img {
    height: 120px;
  }
  .cname {
    font-size: 26px;
  }
  .complete p {
    margin: 0;
    font-size: 30px;
    font-weight: bold;
    color: var(--blue);
  }
  .mark {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--star);
    font-weight: bold;
  }
  .mark.gold {
    color: #e08a00;
  }
  .btns {
    display: flex;
    gap: 12px;
    margin-top: 10px;
  }
  .btns > * {
    padding: 12px 20px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 17px;
    text-decoration: none;
  }
  .next {
    background: var(--blue);
    color: #fff;
  }
  .home,
  .again {
    background: #eef1f4;
    color: var(--ink);
  }
  .toast {
    position: fixed;
    top: calc(24px + env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    z-index: 70;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 26px;
    background: #fffae6;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  .tem {
    font-size: 44px;
  }
  .toast small {
    display: block;
    color: #e08a00;
    font-weight: bold;
    font-size: 12px;
  }
  .toast b {
    font-size: 22px;
  }
  .drive {
    position: fixed;
    bottom: 20px;
    left: -300px;
    height: 200px;
    z-index: 60;
    animation: drive 2s ease-in-out forwards;
    pointer-events: none;
  }
  @keyframes drive {
    to {
      left: 110vw;
    }
  }
</style>
