<script lang="ts">
	import { version } from '$app/environment';
	import { reset, today } from '$lib/progress.svelte';
	import { info } from '$lib/lang.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BackButton from '$lib/components/BackButton.svelte';

	// kit.version.name の既定はビルド時刻（ミリ秒）
	const built = Number.isFinite(Number(version)) ? new Date(Number(version)).toLocaleString('ja-JP') : version;
	let updating = $state(false);

	// 新しい Service Worker を取りに行き、取り込み（HTTP キャッシュを無視した再取得）が終わってから読み直す
	async function update() {
		if (!navigator.onLine) {
			alert('インターネットに接続してから押してください');
			return;
		}
		updating = true;
		const reg = await navigator.serviceWorker?.getRegistration();
		if (reg) {
			await reg.update();
			const w = reg.installing ?? reg.waiting;
			if (w) {
				await new Promise<void>((done) => {
					const t = setTimeout(done, 30000);
					w.addEventListener('statechange', () => {
						if (w.state === 'activated' || w.state === 'redundant') {
							clearTimeout(t);
							done();
						}
					});
				});
			}
		} else {
			await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
		}
		location.reload();
	}

	// 保護者ゲート: 掛け算。1 日 3 回間違えると翌日までロック
	const GATE_KEY = 'kk:gate';
	const MAX_FAILS = 3;
	const loadGate = (): { date: string; fails: number } => {
		try {
			const g = JSON.parse(localStorage.getItem(GATE_KEY) ?? 'null');
			return g?.date === today() ? g : { date: today(), fails: 0 };
		} catch {
			return { date: today(), fails: 0 };
		}
	};
	let gate = $state(loadGate());
	const locked = $derived(gate.fails >= MAX_FAILS);
	const a = Math.floor(Math.random() * 7) + 3,
		b = Math.floor(Math.random() * 7) + 3;
	let ans = $state('');
	let passed = $state(false);
	let wrong = $state(false);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (Number(ans) === a * b) {
			passed = true;
			return;
		}
		gate = { date: today(), fails: gate.fails + 1 };
		localStorage.setItem(GATE_KEY, JSON.stringify(gate));
		ans = '';
		wrong = true;
	}

	function doReset() {
		if (confirm(`「${info().short}」の練習記録・星・メダル・練習した日をすべて削除します。この操作は取り消せません。よろしいですか？`)) {
			reset();
			passed = false;
			alert('削除しました');
		}
	}
</script>

<svelte:head>
	<title>アプリについて | {info().title}</title>
	<meta name="description" content="使い方、星とメダルのルール、更新方法、練習記録の保存と削除についての保護者向け説明。" />
</svelte:head>

<main>
	<header>
		<BackButton />
		<h1>アプリについて</h1>
	</header>

	<section class="card">
		<h2>使い方</h2>
		<ol>
			<li>ホーム上部の「あ ひらがな｜A えいご」で練習することばを切り替えます。記録・星・メダルはことばごとに別々に保存されます。</li>
			<li>ホームで単語を選ぶか、「もじから えらぶ」で文字を選びます。</li>
			<li>文字ごとに <b>なぞる（2 回）→ じぶんで かく → おてほんなし</b> の順に自動で進み、終わると次の文字に移ります。</li>
			<li>
				<b>なぞる</b>: 黄色い線で書き順を見せたあと、番号のついた丸から線に沿って指を動かします。線から外れると振動してやり直しです。
			</li>
			<li><b>じぶんで かく</b>: 薄いお手本の上を自由に塗ります。指を離しても続きが書け、9 割塗れると 1 画完成。線の正確さで星 1〜3 の採点が出ます。</li>
			<li>
				<b>おてほんなし</b>: お手本なしで書き、「できた」を押すと（または 4 秒待つと）何の文字に見えるか判定します。合格すると金の星がつきます。
			</li>
			<li>「きく」で文字の読みを読み上げます。音声はこのボタンでしか流れません。</li>
		</ol>
	</section>

	<section class="card">
		<h2>星とメダル</h2>
		<ul>
			<li>なぞる 2 回と じぶんで かく 1 回を終えると、その文字がクリア（★）になります。</li>
			<li>単語のすべての文字がクリアで単語に ⭐、すべての文字が金の星で 👑 がつきます。</li>
			<li>ホーム右上の 🏆 から進捗率と 42 個のメダルを確認できます。メダルは条件を満たした瞬間に練習画面でお知らせします。</li>
		</ul>
	</section>

	<section class="card">
		<h2>更新</h2>
		<p class="ver">
			<button class="update" onclick={update} disabled={updating}><Icon name="redo" size={20} /> {updating ? '更新中…' : '最新版に更新'}</button>
			<small>いまの版: {built}</small>
		</p>
		<p>
			アプリを更新すると、通常は 2 回起動したときに新しい版に切り替わります。すぐに切り替えたいときは上のボタンを押してください（インターネット接続が必要です）。
		</p>
	</section>

	<section class="card">
		<h2>データについて</h2>
		<ul>
			<li>練習記録・星・メダル・練習した日は、この iPad の中（ブラウザの保存領域）にだけ保存されます。サーバーには送りません。</li>
			<li>ホーム画面のアイコンを削除すると、記録も一緒に消えます。</li>
			<li>書き順データは <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a>（CC BY-SA 3.0）、イラストは <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">Twemoji</a>（CC BY 4.0）を使用しています。</li>
		</ul>
	</section>

	<section class="card danger-zone">
		<h2>練習記録の削除（保護者向け）</h2>
		<p>いま選んでいる「{info().short}」の次の記録をすべて削除して、最初の状態に戻します。<b>削除した記録は元に戻せません。</b>（もう一方のことばの記録は残ります）</p>
		<ul>
			<li>各文字の「なぞる」「じぶんで かく」「おてほんなし」の回数と星</li>
			<li>単語の星と王冠、獲得したメダルと獲得日</li>
			<li>練習した日の記録</li>
		</ul>
		{#if passed}
			<button class="danger" onclick={doReset}>練習記録をすべて削除する</button>
		{:else if locked}
			<p class="lock">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
		{:else}
			<form onsubmit={submit} class="gate">
				<label>お子さまの誤操作を防ぐため、計算に答えてください: <b>{a} × {b} =</b> <input type="number" inputmode="numeric" bind:value={ans} required /></label>
				<button type="submit" class="ok">確認</button>
				{#if wrong}<span class="warn">違います。あと {MAX_FAILS - gate.fails} 回間違えると本日は削除できなくなります。</span>{/if}
			</form>
		{/if}
	</section>
</main>

<style>
	main {
		padding: 16px 22px 40px;
		max-width: 820px;
		-webkit-user-select: text;
		user-select: text;
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
		line-height: 1.7;
	}
	h2 {
		font-size: 17px;
		margin: 0 0 8px;
	}
	ul,
	ol {
		margin: 0;
		padding-left: 22px;
	}
	p {
		margin: 6px 0;
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
	.danger-zone {
		border: 2px solid #f2b8b5;
	}
	.gate {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 8px;
	}
	input {
		width: 80px;
		font-size: 18px;
		padding: 4px 8px;
		margin-left: 6px;
	}
	.ok {
		background: var(--blue);
		color: #fff;
		padding: 8px 16px;
		border-radius: 10px;
		font-weight: bold;
	}
	.warn,
	.lock {
		color: #c62828;
		font-weight: bold;
	}
	.danger {
		background: #e53935;
		color: #fff;
		padding: 10px 16px;
		border-radius: 12px;
		font-weight: bold;
		margin-top: 8px;
	}
</style>
