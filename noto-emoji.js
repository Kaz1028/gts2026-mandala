/*
 * noto-emoji.js — 端末依存の絵文字（Apple/Google/MS）を
 * Google Noto Emoji の SVG 画像へ自動置換する。
 *
 * - ライセンス: Noto Emoji は OFL / Apache-2.0（商用利用可）
 * - 画像は /emoji/*.svg に自前ホスト（CDN非依存・オフラインでも動作）
 * - MutationObserver により、後からJSで描画される要素（演出のリール・
 *   絵文字の雨・フィナーレ等）も自動変換
 *
 * EMOJI_MAP は emoji/ 内の全SVGから自動生成。絵文字を追加する場合は
 * 対応するSVGを emoji/ に置き、本マップへ1行足す。
 */
(function () {
  'use strict';

  // 絵文字 → SVGファイル名（拡張子なし）。emoji/ 配下の全SVGを網羅。
  var EMOJI_MAP = {
    '🇨🇳': '1f1e8_1f1f3',
    '🇮🇳': '1f1ee_1f1f3',
    '🇯🇵': '1f1ef_1f1f5',
    '🇲🇾': '1f1f2_1f1fe',
    '🇸🇬': '1f1f8_1f1ec',
    '🌍': '1f30d',
    '🌎': '1f30e',
    '🌏': '1f30f',
    '🌐': '1f310',
    '🌱': '1f331',
    '🌳': '1f333',
    '🌴': '1f334',
    '🌶': '1f336',
    '🌸': '1f338',
    '🌿': '1f33f',
    '🍗': '1f357',
    '🍜': '1f35c',
    '🍤': '1f364',
    '🎁': '1f381',
    '🎆': '1f386',
    '🎌': '1f38c',
    '🎰': '1f3b0',
    '🏙': '1f3d9',
    '👏': '1f44f',
    '👑': '1f451',
    '💎': '1f48e',
    '💚': '1f49a',
    '💪': '1f4aa',
    '💬': '1f4ac',
    '💰': '1f4b0',
    '💼': '1f4bc',
    '📝': '1f4dd',
    '📤': '1f4e4',
    '📦': '1f4e6',
    '📷': '1f4f7',
    '📸': '1f4f8',
    '🔄': '1f504',
    '🔐': '1f510',
    '🔥': '1f525',
    '🕊': '1f54a',
    '🙌': '1f64c',
    '🚫': '1f6ab',
    '🛕': '1f6d5',
    '🤚': '1f91a',
    '🤝': '1f91d',
    '🥟': '1f95f',
    '🦀': '1f980',
    '🦁': '1f981',
    '🪙': '1fa99',
    '♻': '267b',
    '✅': '2705',
    '✋': '270b',
    '✨': '2728',
    '⬜': '2b1c',
    '⭐': '2b50'
  };

  var BASE = '/emoji/';

  // 長い並び（国旗の2コードポイント）を先にマッチさせる
  var keys = Object.keys(EMOJI_MAP).sort(function (a, b) { return b.length - a.length; });
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // 末尾の異体字セレクタ(FE0F)は任意でマッチ
  var EMOJI_RE = new RegExp('(' + keys.map(escapeRe).join('|') + ')\\uFE0F?', 'g');

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, NOSCRIPT: 1 };

  function makeImg(emoji) {
    var file = EMOJI_MAP[emoji];
    var img = document.createElement('img');
    img.src = BASE + file + '.svg';
    img.alt = emoji;
    img.className = 'noto-emoji';
    img.draggable = false;
    // 万一SVGが欠落しても端末ネイティブ絵文字を出さない（非表示にする）
    img.onerror = function () { img.style.display = 'none'; };
    return img;
  }

  // テキストノード内の絵文字を <img> に置換
  function processTextNode(node) {
    var text = node.nodeValue;
    if (!text || !EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;

    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = EMOJI_RE.exec(text)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      frag.appendChild(makeImg(m[1])); // m[1] = FE0Fを除いた絵文字本体
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    node.parentNode.replaceChild(frag, node);
  }

  function walk(root) {
    if (!root) return;
    // 要素ノード: スキップ対象なら無視
    if (root.nodeType === 1) {
      if (SKIP_TAGS[root.tagName]) return;
      if (root.classList && root.classList.contains('noto-emoji')) return;
    }
    if (root.nodeType === 3) { // テキストノード
      var parent = root.parentNode;
      if (parent && SKIP_TAGS[parent.tagName]) return;
      processTextNode(root);
      return;
    }
    // 子要素を走査（処理中にノードが置換されるためコピーしてから回す）
    var children = [];
    for (var n = root.firstChild; n; n = n.nextSibling) children.push(n);
    for (var i = 0; i < children.length; i++) walk(children[i]);
  }

  function start() {
    walk(document.body);

    // 後から描画される要素を自動変換
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) walk(added[j]);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
