<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/yomi.svelte';
  import Icon from './Icon.svelte';
  import AppStorePopup from './AppStorePopup.svelte';
</script>

<!-- 子どもが App Store へ出ていかないよう、ホームからは保護者向けの「アプリについて」へだけつなぐ -->
<a class="notice" href={resolve('/about')}>
  <span>
    <b>{t('iPad アプリが できました！')}</b>
    <small>{t('おうちの {方|かた}へ：この Web {版|ばん}は 11/30 で おわります')}</small>
  </span>
  <Icon name="back" size={22} />
</a>
<AppStorePopup />

<style>
  .notice {
    display: inline-flex;
    align-items: center;
    gap: 18px;
    margin-top: 14px;
    padding: 10px 20px 10px 22px;
    border-radius: 18px;
    background: var(--blue);
    color: #fff;
    text-decoration: none;
    box-shadow: 0 3px 0 var(--dark);
  }
  span {
    display: grid;
  }
  b {
    font-size: 19px;
  }
  small {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.9;
  }
  .notice :global(svg) {
    transform: scaleX(-1);
  }
</style>
