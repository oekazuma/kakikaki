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

	<div class="cols">
		<div class="left">
			<section class="card">
				<h2>使い方</h2>
				<ol>
					<li>ホーム上部の <b>あ ひらがな｜A えいご</b> で練習することばを切り替えます。</li>
					<li>単語カードか「もじから えらぶ」で文字を選びます。文字ごとに <b>なぞる（2 回）→ じぶんで かく → おてほんなし</b> の順に自動で進みます。</li>
				</ol>
				<dl>
					<dt>なぞる</dt>
					<dd>黄色い線で書き順を見せたあと、番号のついた丸から線に沿って指を動かします。外れると振動してやり直し。</dd>
					<dt>じぶんで かく</dt>
					<dd>薄いお手本の上を自由に塗ります。指を離しても続きが書け、9 割塗れると 1 画完成。線の正確さで星 1〜3 の採点。</dd>
					<dt>おてほんなし</dt>
					<dd>お手本なしで書き、「できた」か 4 秒待つと何の文字に見えるか判定。合格で金の星。</dd>
					<dt>きく</dt>
					<dd>文字と単語を読み上げます。音声はこのボタンでしか流れません。</dd>
				</dl>
			</section>

			<section class="card">
				<h2>星・メダル・クイズ</h2>
				<ul>
					<li>なぞる 2 回 + じぶんで かく 1 回で文字クリア（★）。単語の全文字クリアで星、全文字が金の星で王冠がカードに付きます。</li>
					<li>ホームのトロフィーのボタンから進捗率とメダルを確認できます。条件を満たした瞬間に練習画面でお知らせします。</li>
					<li>クイズは よみ（10 問）と かき（5 問）。単語の文字数で かんたん・ふつう・むずかしい に分かれ、正解数を記録します。</li>
					<li>記録・星・メダル・クイズの正解数は ひらがな と えいご で別々に保存されます。</li>
				</ul>
			</section>

			<section class="card">
				<h2>iPad のホーム画面に追加する</h2>
				<ol>
					<li>Safari でこのアプリの URL を開く</li>
					<li>画面上部の <b>共有ボタン</b>（四角から矢印が出たマーク）を押す</li>
					<li><b>「ホーム画面に追加」</b> を選び、右上の「追加」を押す</li>
				</ol>
				<p>ホーム画面のアイコンから開くと、Safari のバーが消えて全画面で使えます。横向きでお使いください。</p>
			</section>

			<section class="card">
				<h2>オフラインでも使えます</h2>
				<p>一度開けば、文字・イラスト・効果音はすべて iPad の中に保存されるので、インターネットがなくても練習できます。読み上げは iPadOS の音声を使うため、これもオフラインで動きます。</p>
				<p>新しいバージョンが出たときは、通常は 2 回起動したときに切り替わります。すぐに切り替えたいときは右の「最新版に更新」を押してください（このときだけインターネットが必要です）。</p>
			</section>

			<section class="card">
				<h2>データについて</h2>
				<ul>
					<li>練習記録は、この iPad のブラウザの保存領域にだけ保存します。サーバーには送りません。</li>
					<li>ホーム画面のアイコンを削除すると、記録も一緒に消えます。</li>
					<li>書き順データは <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a>（CC BY-SA 3.0）、イラストは <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">Twemoji</a>（CC BY 4.0）を使用しています。</li>
				</ul>
			</section>
		</div>

		<aside class="right">
			<section class="card">
				<h2>更新</h2>
				<button class="update" onclick={update} disabled={updating}><Icon name="redo" size={20} /> {updating ? '更新中…' : '最新版に更新'}</button>
				<small>いまのバージョン: {built}</small>
			</section>

			<section class="card danger-zone">
				<h2>練習記録の削除</h2>
				<p>いま選んでいる「{info().short}」の記録をすべて消して最初の状態に戻します。<b>元に戻せません。</b></p>
				<ul>
					<li>各文字の回数と星</li>
					<li>単語の星と王冠</li>
					<li>メダルと獲得日、練習した日</li>
					<li>クイズの正解数</li>
				</ul>
				{#if passed}
					<button class="danger" onclick={doReset}>「{info().short}」の記録を削除する</button>
				{:else if locked}
					<p class="lock">本日は {MAX_FAILS} 回間違えたため、削除は明日まで行えません。</p>
				{:else}
					<form onsubmit={submit} class="gate">
						<label>誤操作を防ぐため、計算に答えてください<br /><b>{a} × {b} =</b> <input type="number" inputmode="numeric" bind:value={ans} required /><button type="submit" class="ok">確認</button></label>
						{#if wrong}<span class="warn">違います。あと {MAX_FAILS - gate.fails} 回間違えると本日は削除できなくなります。</span>{/if}
					</form>
				{/if}
			</section>
		</aside>
	</div>
</main>

<style>
	main {
		padding: 16px 22px 40px;
		-webkit-user-select: text;
		user-select: text;
	}
	header {
		display: flex;
		gap: 14px;
		align-items: center;
		margin-bottom: 14px;
	}
	h1 {
		margin: 0;
		font-size: 22px;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 16px;
		align-items: start;
	}
	.left,
	.right {
		display: grid;
		gap: 14px;
	}
	.right {
		position: sticky;
		top: 16px;
	}
	section {
		padding: 16px 20px;
		line-height: 1.7;
		font-size: 15px;
	}
	h2 {
		font-size: 17px;
		margin: 0 0 8px;
		color: var(--blue);
	}
	ul,
	ol {
		margin: 0;
		padding-left: 22px;
	}
	p {
		margin: 6px 0 0;
	}
	dl {
		margin: 8px 0 0;
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 4px 12px;
	}
	dt {
		font-weight: bold;
	}
	dd {
		margin: 0;
	}
	.update {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		background: var(--teal);
		color: #fff;
		padding: 12px 16px;
		border-radius: 14px;
		font-weight: bold;
		font-size: 16px;
	}
	.update:disabled {
		opacity: 0.6;
	}
	small {
		display: block;
		margin-top: 8px;
		color: var(--sub);
		text-align: center;
	}
	.danger-zone {
		border: 2px solid #f2b8b5;
	}
	.danger-zone h2 {
		color: #c62828;
	}
	.gate {
		margin-top: 10px;
		display: grid;
		gap: 8px;
	}
	.gate label {
		display: block;
	}
	input {
		width: 80px;
		font-size: 18px;
		padding: 4px 8px;
		margin: 0 8px 0 6px;
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
		width: 100%;
		background: #e53935;
		color: #fff;
		padding: 12px 16px;
		border-radius: 14px;
		font-weight: bold;
		margin-top: 10px;
	}
</style>
