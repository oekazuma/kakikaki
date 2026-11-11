<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/yomi.svelte';
  import Icon from './Icon.svelte';
  import AppStorePopup from './AppStorePopup.svelte';
</script>

<div class="notice">
  <span class="text">
    <b>{t('iPhone・iPad アプリが できました！')}</b>
    <small>{t('おうちの {方|かた}へ：この Web {版|ばん}は 11/30 まで')}</small>
  </span>
  <a class="more" href={resolve('/about')}>くわしく</a>
  <a class="store" href="https://apps.apple.com/jp/app/id6832798120" target="_blank" rel="noreferrer"
    >{t('App Store で {見|み}る')} <Icon name="back" size={18} /></a
  >
</div>
<AppStorePopup />

<style>
  .notice {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    padding: 10px 12px 10px 22px;
    border-radius: 18px;
    background: var(--blue);
    color: #fff;
    box-shadow: 0 3px 0 var(--dark);
  }
  .text {
    display: grid;
    margin-right: 10px;
  }
  b {
    font-size: 19px;
  }
  small {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.9;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 10px 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: bold;
    text-decoration: none;
    white-space: nowrap;
  }
  .more {
    background: rgb(255 255 255 / 0.2);
    color: #fff;
  }
  .store {
    background: #fff;
    color: var(--blue);
  }
  .store :global(svg) {
    transform: scaleX(-1);
  }
</style>
