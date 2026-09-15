<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import ProgressDetail from './ProgressDetail.svelte';
  import { LANGS, info } from '$lib/lang.svelte';
  import { profiles, type Profile } from '$lib/profiles.svelte';
  import { summaryOf } from '$lib/progress.svelte';
  import { TOTAL } from '$lib/badges';
  // 保護者向け: 人ごとに 1 行の一覧（ことばごとのクリア文字数だけ）。押すと詳細のモーダル
  const rows = $derived(
    profiles.list.map((p) => ({
      p,
      chips: LANGS.map((l) => ({ l, chars: summaryOf(p.id, l).chars, total: TOTAL(l).chars }))
    }))
  );
  let open = $state<Profile | null>(null);
</script>

<section class="card">
  <h2>みんなの進み具合</h2>
  <ul>
    {#each rows as { p, chips } (p.id)}
      <li>
        <button onclick={() => (open = p)}>
          <Avatar avatar={p.avatar} size={36} />
          <b>{p.name}</b>
          {#each chips as { l, chars, total } (l)}
            <span class={['chip', { none: chars === 0 }]}
              >{info(l).short} {chars === 0 ? 'まだ' : `${chars}/${total}`}</span
            >
          {/each}
          <Icon name="back" size={18} />
        </button>
      </li>
    {/each}
  </ul>
  <p class="note">押すと文字・単語・行ごとの進み具合、クイズの正解数、苦手な文字が見られます。</p>
</section>

{#if open}
  <ProgressDetail p={open} onclose={() => (open = null)} />
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li + li {
    border-top: 1px solid #e6e9ed;
  }
  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    text-align: left;
    font-size: 14px;
  }
  b {
    min-width: 6em;
  }
  .chip {
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--pill);
    font-weight: bold;
    font-size: 13px;
    white-space: nowrap;
  }
  .chip.none {
    color: var(--sub);
    font-weight: normal;
  }
  button :global(svg) {
    margin-left: auto;
    transform: scaleX(-1);
    color: var(--sub);
  }
  .note {
    color: var(--sub);
    font-size: 13px;
  }
</style>
