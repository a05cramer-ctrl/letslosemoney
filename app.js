(function () {
  var C = window.LLM_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // header goes solid after the hero
  var top = $('.top');
  var onScroll = function () { top.classList.toggle('solid', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  $$('[data-link]').forEach(function (a) { var h = (C.links || {})[a.getAttribute('data-link')]; if (h) a.href = h; else a.hidden = true; });

  // CA
  var ca = (C.contractAddress || '').trim();
  if (ca) {
    var buy = C.launchpad === 'raydium' ? 'https://raydium.io/launchpad/token/?mint=' + ca : 'https://pump.fun/coin/' + ca;
    $('#ca').setAttribute('data-state', 'live');
    $('#ca-text').textContent = ca;
    $$('.buy-link').forEach(function (a) { a.href = buy; });
    $$('.chart-link').forEach(function (a) { a.href = 'https://dexscreener.com/solana/' + ca; });
    $$('[data-buy]').forEach(function (a) { a.href = buy; a.target = '_blank'; a.rel = 'noopener'; });
    $('#copy-ca').addEventListener('click', function () { var b = this; navigator.clipboard && navigator.clipboard.writeText(ca).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); }); });
  } else {
    document.body.classList.add('launching');
    var t = new Date(C.launchTimeUtc || '');
    if (!isNaN(t)) {
      $('#launch-time').textContent = t.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      var tick = function () { var s = Math.max(0, Math.floor((t - Date.now()) / 1000)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); $('#countdown').textContent = s ? pad(h) + ':' + pad(m) + ':' + pad(s % 60) : 'CA posted on X'; };
      tick(); setInterval(tick, 1000);
    }
    $$('[data-buy]').forEach(function (a) { a.textContent = 'Launching soon'; });
  }

  // ---- chat ----
  var ANSWERS = [
    'Great question. Based on my analysis of every chart ever made, you should buy the top.',
    'As a large language model, I cannot give financial advice. Ape it.',
    'I analysed 10,000 charts. All of them went down.',
    'Yes. I am 100% confident. I am often 100% confident.',
    'Let me think step by step. Step 1: buy. Step 2: lose money.',
    'I have summarised your portfolio: gone.',
    'I hallucinated the chart. It was red.',
    'Strong buy. Source: I made it up.',
    'You are absolutely right to buy here. You are absolutely right about everything.',
    'My training data ends exactly at the local top.',
  ];
  var thread = $('#thread'), form = $('#ask-form'), input = $('#q'), send = form.querySelector('.send');
  var busy = false, last = null;

  function add(role, html) {
    var m = document.createElement('div'); m.className = 'msg ' + role;
    m.innerHTML = (role === 'bot' ? '<img class="av" src="assets/logo-128.png" alt="">' : '') + '<div class="bubble">' + html + '</div>';
    thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m.querySelector('.bubble');
  }
  function streamText(el, text, done) {
    if (reduce) { el.textContent = text; return done(); }
    var words = text.split(' '), i = 0; el.classList.add('caret');
    (function step() {
      el.textContent = words.slice(0, ++i).join(' ');
      thread.scrollTop = thread.scrollHeight;
      if (i < words.length) setTimeout(step, 55 + Math.random() * 70); else { el.classList.remove('caret'); done(); }
    })();
  }
  function chart(el, loss, done) {
    var box = document.createElement('div'); box.className = 'chart';
    var cv = document.createElement('canvas'); cv.width = 1200; cv.height = 300; box.appendChild(cv); el.appendChild(box);
    var g = cv.getContext('2d'), N = 16, candles = [], p = 100;
    for (var i = 0; i < N; i++) { var o = p; p = Math.max(100 - loss, p - (loss / N) * (0.6 + Math.random() * 0.9) + (Math.random() < 0.18 ? 3 : 0)); candles.push({ o: o, c: p, h: Math.max(o, p) + Math.random() * 3, l: Math.min(o, p) - Math.random() * 3 }); }
    var min = 100 - loss - 6, max = 106, y = function (v) { return 20 + (max - v) / (max - min) * 260; };
    var shown = 0;
    (function frame() {
      shown = reduce ? N : shown + 1;
      g.fillStyle = '#0d0926'; g.fillRect(0, 0, 1200, 300);
      g.strokeStyle = 'rgba(255,255,255,0.06)'; for (var gy = 40; gy < 300; gy += 50) { g.beginPath(); g.moveTo(0, gy); g.lineTo(1200, gy); g.stroke(); }
      for (var k = 0; k < shown; k++) {
        var c = candles[k], x = 40 + k * 72, up = c.c > c.o;
        g.strokeStyle = g.fillStyle = up ? '#ffffff' : '#f21648';
        g.beginPath(); g.moveTo(x + 20, y(c.h)); g.lineTo(x + 20, y(c.l)); g.lineWidth = 4; g.stroke();
        g.fillRect(x, Math.min(y(c.o), y(c.c)), 40, Math.max(8, Math.abs(y(c.o) - y(c.c))));
      }
      thread.scrollTop = thread.scrollHeight;
      if (shown < N) setTimeout(frame, 70); else done();
    })();
  }
  function ask(q) {
    if (busy) return; busy = true; send.disabled = true;
    add('user', esc(q));
    var a = ANSWERS[Math.floor(Math.random() * ANSWERS.length)], loss = 40 + Math.floor(Math.random() * 60);
    var bub = add('bot', '<span class="caret">thinking</span>');
    setTimeout(function () {
      bub.innerHTML = ''; var txt = document.createElement('div'); bub.appendChild(txt);
      streamText(txt, a, function () {
        chart(bub, loss, function () {
          var l = document.createElement('div'); l.className = 'loss'; l.textContent = '-' + loss + '%'; bub.appendChild(l);
          thread.scrollTop = thread.scrollHeight;
          last = { q: q, a: a, loss: loss }; drawCard(); busy = false; send.disabled = false;
        });
      });
    }, reduce ? 0 : 650);
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); var q = input.value.trim().slice(0, 80); if (!q) return; input.value = ''; ask(q); });
  $$('#suggest button').forEach(function (b) { b.addEventListener('click', function () { ask(b.textContent); }); });

  // ---- share card ----
  var cv = $('#card'), ctx = cv.getContext('2d'), mark = new Image(); mark.src = 'assets/llm-pfp-400.png';
  var wrap = function (text, x, y, maxW, lh) { var words = text.split(' '), line = '', n = 0; words.forEach(function (w) { var t2 = line ? line + ' ' + w : w; if (ctx.measureText(t2).width > maxW && line) { ctx.fillText(line, x, y + n++ * lh); line = w; } else line = t2; }); ctx.fillText(line, x, y + n * lh); };
  function drawCard() {
    if (!last) return; var W = cv.width, H = cv.height;
    ctx.fillStyle = '#422faf'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (var gx = 0; gx < W; gx += 24) for (var gy = 0; gy < H; gy += 24) ctx.fillRect(gx, gy, 2, 2);
    ctx.imageSmoothingEnabled = false; if (mark.complete) ctx.drawImage(mark, W - 290, 50, 230, 230);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText('you asked', 70, 100);
    ctx.fillStyle = '#fff'; ctx.font = '600 40px "Inter Tight", sans-serif'; wrap('"' + last.q + '"', 70, 152, W - 430, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText('$LLM says', 70, 320);
    ctx.fillStyle = '#fff'; ctx.font = '700 44px "Pixelify Sans", monospace'; wrap(last.a, 70, 374, W - 140, 52);
    ctx.fillStyle = '#f21648'; ctx.font = '700 120px "Pixelify Sans", monospace'; ctx.fillText('-' + last.loss + '%', 70, H - 56);
    ctx.fillStyle = '#fff'; ctx.font = '700 34px "Pixelify Sans", monospace'; ctx.textAlign = 'right'; ctx.fillText("$LLM · Let's Lose Money", W - 60, H - 66); ctx.textAlign = 'left';
    $('#share').hidden = false;
    $('#post').href = 'https://x.com/intent/post?text=' + encodeURIComponent('I asked $LLM: "' + last.q + '"\n\n' + last.a + '\n\n-' + last.loss + "%. Let's Lose Money.");
  }
  $('#dl').addEventListener('click', function () { var a = document.createElement('a'); a.download = 'llm-answer.png'; a.href = cv.toDataURL('image/png'); a.click(); });
})();
