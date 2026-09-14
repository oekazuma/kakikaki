<script lang="ts">
  import { resolve } from '$app/paths';
  import Avatar from './Avatar.svelte';
  import { current } from '$lib/profiles.svelte';
</script>

<a class="card who" href={resolve('/profiles')} aria-label="だれが つかう？">
  <Avatar avatar={current().avatar} size={44} />
  <b>{current().name}</b>
</a>

<style>
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 14px 4px 4px;
    border-radius: 30px;
    text-decoration: none;
    color: var(--ink);
    font-size: 15px;
    white-space: nowrap;
  }
  /* 名前は 10 文字まで保存できるが、ヘッダーを 1 行に保つため長い名前は省略して見せる */
  .who b {
    display: block;
    max-width: 7em;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* 幅 1024 の iPad ではアバターだけ */
  @media (max-width: 1130px) {
    .who {
      padding-right: 4px;
    }
    .who b {
      display: none;
    }
  }
</style>
