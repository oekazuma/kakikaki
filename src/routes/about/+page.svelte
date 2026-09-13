<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import { base } from '$app/paths';
	import { version } from '$app/environment';
	import { reset } from '$lib/progress.svelte';
	import Icon from '$lib/components/Icon.svelte';

	// kit.version.name の既定はビルド時刻（ミリ秒）
	const built = Number.isFinite(Number(version)) ? new Date(Number(version)).toLocaleString('ja-JP') : version;
	let updating = $state(false);

	// Service Worker とキャッシュを捨てて読み直す。次回起動時ではなく今すぐ新版にするため
	async function update() {
		if (!navigator.onLine) {
			alert('インターネットに接続してから押してください');
			return;
		}
		updating = true;
		const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
		await Promise.all(regs.map((r) => r.unregister()));
		await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
		location.reload();
	}
	const a = Math.floor(Math.random() * 8) + 2,
		b = Math.floor(Math.random() * 8) + 1;
	let ans = $state('');
	const ok = $derived(Number(ans) === a + b);
	function doReset() {
		if (confirm('練習記録と星をすべてリセットします。取り消せません。よろしいですか？')) {
			reset();
			alert('リセットしました');
		}
	}
</script>

<main>
	<header>
		<BackButton />
		<h1>アプリについて</h1>
	</header>
	<section class="card">
		<h2>つかいかた</h2>
		<ul>
			<li>ホームで のりものを えらぶか、「もじから えらぶ」で もじを えらびます。</li>
			<li>「なぞる」は いろの まるから みちに そって ゆびを うごかします。</li>
			<li>「じぶんで かく」は おてほんの うえを じゆうに ぬります。</li>
			<li>「おてほんなし」は おてほんを みないで かき、「できた」で こたえあわせ。</li>
		</ul>
	</section>
	<section class="card parent">
		<h2>保護者の方へ</h2>
		<p class="ver">
			<button class="update" onclick={update} disabled={updating}><Icon name="redo" size={20} /> {updating ? 'こうしんちゅう…' : 'さいしんに こうしん'}</button>
			<small>いまの版: {built}</small>
		</p>
		<p>
			書き順データは <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a>（CC BY-SA 3.0）、イラストは <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">Twemoji</a>（CC BY 4.0）を使用しています。練習記録はこの iPad の中にだけ保存されます。
		</p>
		<p>{a} + {b} = <input type="number" inputmode="numeric" bind:value={ans} /></p>
		{#if ok}<button class="danger" onclick={doReset}>練習記録をリセット</button>{/if}
	</section>
</main>

<style>
	main {
		padding: 16px 22px 40px;
		max-width: 760px;
	}
	header {
		display: flex;
		gap: 14px;
		align-items: center;
		margin-bottom: 12px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
	}
	section {
		padding: 16px 20px;
		margin-bottom: 14px;
	}
	h2 {
		font-size: 17px;
		margin: 0 0 8px;
	}
	.parent {
		-webkit-user-select: text;
		user-select: text;
	}
	input {
		width: 80px;
		font-size: 18px;
		padding: 4px 8px;
	}
	.ver {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.update {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--teal);
		color: #fff;
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: bold;
	}
	.update:disabled {
		opacity: 0.6;
	}
	small {
		color: var(--sub);
	}
	.danger {
		background: #e53935;
		color: #fff;
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: bold;
	}
</style>
