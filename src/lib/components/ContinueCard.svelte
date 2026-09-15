<script lang="ts">
  import { goto } from '$app/navigation';
  import WordCard from './WordCard.svelte';
  import { practiceUrl } from '$lib/nav';
  import { nextOpenWord } from '$lib/practice.svelte';
  import { unlock } from '$lib/audio';
  // ホームの先頭: やりかけの単語を 1 枚。無ければ何も出さない
  const next = $derived(nextOpenWord());
</script>

{#if next}
  <h2>つづきから</h2>
  <div class="row">
    <WordCard
      word={next}
      size={150}
      fill
      onclick={() => {
        unlock();
        goto(practiceUrl(next.id));
      }}
    />
  </div>
{/if}

<style>
  h2 {
    font-size: 18px;
    color: var(--teal);
    margin: 22px 0 8px;
  }
  /* ホームの一覧と同じマス幅にそろえる */
  .row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 6px 0 10px;
  }
</style>
