<script lang="ts">
  // 保護者向けの説明。節ごとに折りたたみ、最初の節だけ開いておく。standalone のときはホーム画面追加の節を隠す
  let { standalone }: { standalone: boolean } = $props();
</script>

<details class="card" open>
  <summary>練習の流れ</summary>
  <ol>
    <li>ホーム上部の <b>あ ひらがな｜ア かたかな｜漢 かんじ｜A えいご</b> で練習することばを切り替えます。</li>
    <li>
      単語カードか「もじから えらぶ」で文字を選びます。文字ごとに <b>なぞる（2 回）→ じぶんで かく</b> と自動で進みます。
    </li>
    <li>単語の全文字を終えると、完了画面の「おてほんなしに ちょうせん」から <b>おてほんなし</b> に挑戦できます。</li>
  </ol>
  <dl>
    <dt>なぞる</dt>
    <dd>黄色い線で書き順を見せたあと、番号の丸から線に沿って指を動かします。外れると振動してやり直し。</dd>
    <dt>じぶんで かく</dt>
    <dd>薄いお手本の上を塗ります。9 割塗れると 1 画完成。「ひとつ もどる」で最後の線を消せます。</dd>
    <dt>おてほんなし</dt>
    <dd>お手本なしで書き、「できた」か 4 秒待つと判定。合格で金の星。</dd>
    <dt>きく</dt>
    <dd>右の「きく」はいまの 1 文字、単語カードのスピーカーは単語全体を読み上げます。</dd>
  </dl>
</details>

<details class="card">
  <summary>星・メダル・クイズ</summary>
  <ul>
    <li>
      なぞる 2 回 + じぶんで かく 1 回で文字クリア。単語を最後まで練習すると星、その単語の全文字で おてほんなし
      に合格すると王冠。
    </li>
    <li>メダルはホームのトロフィーから。条件を満たした瞬間に練習画面でお知らせします。</li>
    <li>連続日数は 4 ことば をまたいで数え、今日まだ練習していなくても前日まで続いていれば切れません。</li>
    <li>クイズは よみ（10 問、5 形式）と かき（5 問。絵を見て書く・聞いて書く・穴埋め）。単語の文字数で 3 段階。</li>
    <li>
      かんじ は小学 1〜3 年の 440 字を学年ごとに並べ、字と読みを 1
      字ずつ練習します。クイズは学年で範囲を絞り、よみ（字を見て読みを選ぶ・読みを聞いて字を選ぶ）と
      かき（読みを見て書く。同じ読みの字はどれを書いても正解）です。
    </li>
  </ul>
</details>

<details class="card">
  <summary>使う人（10 人まで）</summary>
  <ul>
    <li>ホーム左上の顔のボタンで切り替えます。記録・星・メダル・クイズの正解数は人ごと・ことばごとに別々です。</li>
    <li>名前とアバター（用意した絵か、端末内の写真）は「だれが つかう？」の鉛筆ボタンで変えられます。</li>
  </ul>
</details>

{#if !standalone}
  <details class="card">
    <summary>タブレットのホーム画面に追加する</summary>
    <ol>
      <li>iPad（Safari）: 共有ボタン → 「ホーム画面に追加」→「追加」</li>
      <li>Android（Chrome）: 右上の ⋮ メニュー → 「ホーム画面に追加」</li>
    </ol>
    <p>アイコンから開くとブラウザのバーが消えて全画面になります。横向きでお使いください。</p>
  </details>
{/if}

<details class="card">
  <summary>オフラインと更新</summary>
  <ul>
    <li>
      一度開けば文字・イラスト・効果音は端末に保存され、インターネットがなくても練習できます。読み上げも端末の音声です。
    </li>
    <li>
      新しいバージョンが出るとホーム右上の ?
      に赤い丸が付きます。すぐ切り替えるときは「アプリについて」の「最新版に更新」。
    </li>
  </ul>
</details>

<details class="card">
  <summary>データの保存と削除</summary>
  <ul>
    <li>記録とアバターの写真はこの端末のブラウザにだけ保存します。サーバーには送りません。</li>
    <li>
      リセットや人の削除は「だれが つかう？」の鉛筆ボタン →「けす・リセット」から（保護者向けの計算と確認があります）。
    </li>
    <li>
      ホーム画面のアイコンを削除すると記録も消えます。「アプリについて」のバックアップ（書き出し・共有）で残しておけます。
    </li>
    <li>
      書き順は <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a>（CC BY-SA
      3.0）、フォントは
      <a href="https://github.com/fontworks-fonts/Klee" target="_blank" rel="noreferrer">Klee One</a>（SIL OFL
      1.1）、イラストは
      <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">Twemoji</a>（CC BY 4.0）。
    </li>
  </ul>
</details>

<style>
  details {
    padding: 4px 20px;
    line-height: 1.7;
    font-size: 15px;
  }
  summary {
    padding: 12px 0;
    font-size: 17px;
    font-weight: bold;
    color: var(--blue);
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '＋';
    color: var(--sub);
    font-weight: normal;
  }
  details[open] summary::after {
    content: '－';
  }
  ul,
  ol {
    margin: 0 0 12px;
    padding-left: 22px;
  }
  p {
    margin: 0 0 12px;
  }
  dl {
    margin: 4px 0 12px;
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
</style>
