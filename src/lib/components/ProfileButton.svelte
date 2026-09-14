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
