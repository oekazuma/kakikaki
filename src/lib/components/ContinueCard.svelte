<script lang="ts">
  import { goto } from '$app/navigation';
  import WordCard from './WordCard.svelte';
  import KanjiCell from './KanjiCell.svelte';
  import { lang } from '$lib/lang.svelte';
  import { practiceUrl } from '$lib/nav';
  import { openWords } from '$lib/practice.svelte';
  import { unlock } from '$lib/audio';
  // ホームの先頭: やりかけの単語を最近のものから。無ければ何も出さない。かんじ は一覧と同じマスで出す
  const words = $derived(openWords());
</script>

{#if words.length}
  <h2>つづきから</h2>
  {#if lang.v === 'kanji'}
    <div class="grid">
      {#each words as w (w.id)}<KanjiCell c={w.name} />{/each}
    </div>
  {:else}
    <div class="row">
      {#each words as w (w.id)}
        <WordCard
          word={w}
          size={150}
          fill
          onclick={() => {
            unlock();
            goto(practiceUrl(w.id));
          }}
        />
      {/each}
    </div>
  {/if}
{/if}

<style>
  h2 {
    font-size: 18px;
    color: var(--teal);
    margin: 22px 0 8px;
  }
  /* ホームの一覧と同じマス幅にそろえる */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 8px;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 6px 0 10px;
  }
</style>
