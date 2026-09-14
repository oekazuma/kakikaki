<script lang="ts">
  import { base } from '$app/paths';
  // 候補（単語 id）なら static/img から、写真なら data URL をそのまま表示
  let { avatar, size = 64 }: { avatar: string; size?: number } = $props();
  const photo = $derived(avatar.startsWith('data:'));
</script>

<span class={['avatar', { photo }]} style:width="{size}px" style:height="{size}px">
  <img
    src={photo ? avatar : `${base}/img/${avatar}.svg`}
    alt=""
    width={size}
    height={size}
    style:width="{photo ? size : size * 0.7}px"
    style:height="{photo ? size : size * 0.7}px"
    loading="eager"
  />
</span>

<style>
  .avatar {
    display: inline-grid;
    place-content: center;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #e3e8ee;
    overflow: hidden;
    flex: none;
  }
  img {
    object-fit: contain;
  }
  .photo img {
    object-fit: cover;
  }
</style>
