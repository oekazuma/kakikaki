<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/yomi.svelte';
  import Icon from './Icon.svelte';
</script>

<!-- 子どもが App Store へ出ていかないよう、ホームからは保護者向けの「アプリについて」へだけつなぐ -->
<a class="card notice" href={resolve('/about')}>
  {t('おうちの {方|かた}へ：iPad アプリが できました（この Web {版|ばん}は 11/30 まで）')}
  <Icon name="back" size={18} />
</a>

<style>
  .notice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 8px 16px;
    font-size: 15px;
    font-weight: bold;
    color: var(--blue);
    text-decoration: none;
  }
  .notice :global(svg) {
    transform: scaleX(-1);
  }
</style>
