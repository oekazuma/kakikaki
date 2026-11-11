<script lang="ts">
  import { t } from '$lib/yomi.svelte';
  import Icon from './Icon.svelte';
  import AppStorePopup from './AppStorePopup.svelte';
</script>

<a class="notice" href="https://apps.apple.com/jp/app/id6832798120" target="_blank" rel="noreferrer">
  <span>
    <b>{t('iPhone・iPad アプリが できました！')}</b>
    <small>{t('おうちの {方|かた}へ：App Store で {見|み}られます（この Web {版|ばん}は 11/30 まで）')}</small>
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
