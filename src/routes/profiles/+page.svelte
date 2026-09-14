<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import BackButton from '$lib/components/BackButton.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ProfileEditor from '$lib/components/profiles/ProfileEditor.svelte';
  import Egg from '$lib/components/balloon/Egg.svelte';
  import { info } from '$lib/lang.svelte';
  import { profiles, MAX_PROFILES } from '$lib/profiles.svelte';
  import { switchProfile } from '$lib/progress.svelte';
  import { unlock } from '$lib/audio';

  // 編集中の id。'' は新規追加、null は閉じている
  let editing = $state<string | null>(null);
  function use(id: string) {
    unlock();
    switchProfile(id);
    goto(resolve('/'));
  }
</script>

<svelte:head>
  <title>だれが つかう？ | {info().title}</title>
  <meta name="description" content="使う人を選ぶ・追加する・名前とアバターを変える。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1><Icon name="user" /> だれが つかう？</h1>
    <span class="count">{profiles.list.length} / {MAX_PROFILES} にん</span>
  </header>
  <div class="grid">
    {#each profiles.list as p (p.id)}
      <div class={['card', 'person', { on: p.id === profiles.cur }]}>
        <button class="use" onclick={() => use(p.id)}>
          <Avatar avatar={p.avatar} size={110} />
          <b>{p.name}</b>
          <small>{info(p.lang).short}</small>
        </button>
        <button class="edit" onclick={() => (editing = p.id)} aria-label="へんしゅう"
          ><Icon name="pencil" size={20} /></button
        >
      </div>
    {/each}
    {#if profiles.list.length < MAX_PROFILES}
      <button class="card person add" onclick={() => (editing = '')}>
        <span class="plus"><Icon name="plus" size={44} /></span>
        <b>ついか する</b>
      </button>
    {/if}
  </div>
  {#if editing !== null}
    <ProfileEditor id={editing || null} onclose={() => (editing = null)} />
  {/if}
  <Egg />
</main>

<style>
  main {
    padding: 16px 22px 40px;
    min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
  header {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 18px;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h1 :global(svg) {
    color: var(--blue);
  }
  .count {
    font-weight: bold;
    color: var(--sub);
    background: #fff;
    padding: 8px 14px;
    border-radius: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
  .person {
    position: relative;
    min-height: 200px;
    border: 4px solid transparent;
    transition: transform 0.15s;
  }
  .person.on {
    border-color: var(--blue);
    background: #eef4ff;
  }
  .use,
  .add {
    width: 100%;
    height: 100%;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 8px;
    padding: 18px 10px;
    font-size: 20px;
  }
  .use:active,
  .add:active {
    transform: scale(0.97);
  }
  .use small {
    color: var(--sub);
    font-size: 13px;
  }
  .edit {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: var(--pill);
    color: var(--sub);
    display: grid;
    place-content: center;
  }
  .add {
    color: var(--teal);
  }
  .plus {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    border: 3px dashed var(--teal);
    display: grid;
    place-content: center;
  }
</style>
