// 생성물 — 고칠 땐 update/src/farm_page.js (build_html2.build_tool_pages)
// 파밍 빌드 공유 목록 (/tli/farm, 2026-10-16) — 허공의 성도 배치 공유 글(/api/vshares)을 추천·조회·최신순으로. 글을 누르면 /tli/void/?s=ID
(function () {
  'use strict';
  const ICON = 'https://cdn.tlidb.com/UI/Textures/Common/Icon/TalentPoint/128/';
  const app = document.getElementById('farmApp');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const BYKEY = new Map(VOID.list.map(c => [Math.floor(+c.start / 100), c]));
  const kday = iso => iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 10) : '';
  let sort = 'likes', q = '', list = [], more = false, busy = false;
  try { const o = JSON.parse(localStorage.getItem('tli_farm_ui_v1') || '{}'); if (['likes', 'views', 'new'].includes(o.sort)) sort = o.sort; } catch (e) {}

  // 배치 코드에서 탐침·나침반(key 9000, 탐침 1 + 나침반 4) 꺼내기 — 목록 카드 아이콘용 (2026-10-28 사용자)
  const GBY = typeof VOID_GEAR === 'object' ? new Map(VOID_GEAR.p.concat(VOID_GEAR.c).map(x => [x.id, x])) : new Map();
  function gearOf(code) {
    try {
      const b = [...atob(String(code).replace(/-/g, '+').replace(/_/g, '/'))].map(ch => ch.charCodeAt(0));
      let i = 0; const vi = () => { let n = 0, sh = 0, x; do { x = b[i++]; if (x == null) throw 0; n |= (x & 127) << sh; sh += 7; } while (x & 128); return n; };
      if (vi() !== 1) return [];
      while (i < b.length) {
        const key = vi(), k = vi(), a = []; for (let j = 0; j < k; j++) a.push(vi());
        if (key === 9000) return a.map(id => GBY.get(id)).filter(Boolean);
      }
    } catch (e) {}
    return [];
  }
  function card(x) {
    let pts = []; try { pts = JSON.parse(x.pts || '[]') || []; } catch (e) {}
    const cs = pts.map(([k, n]) => [BYKEY.get(k), n]).filter(p => p[0]).sort((a, b) => b[1] - a[1]);
    const tot = cs.reduce((t, p) => t + p[1], 0), gs = gearOf(x.code);
    return `<a class="fm-card" href="/tli/void/?s=${encodeURIComponent(x.id)}">
      <div class="fm-t"><b data-noi18n>${esc(x.title)}</b>${x.hv ? '<span class="fm-v">🎬 영상</span>' : ''}</div>
      <div class="fm-m"><span data-noi18n>👤 ${esc(x.author)}</span><span>${kday(x.created_at)}</span><span>👍 ${x.likes || 0}</span><span>👁 ${x.views || 0}</span></div>
      <div class="fm-cs">${cs.slice(0, 8).map(([c, n]) => `<span class="fm-c" title="${esc(c.name)}"><img src="${ICON + c.icon}" alt="" loading="lazy"><i>${n}</i></span>`).join('')}${cs.length > 8 ? `<span class="fm-more">+${cs.length - 8}</span>` : ''}
        <span class="fm-tot">노드 ${tot}개</span></div>
      ${gs.length ? `<div class="fm-gs">${gs.map(it => `<span class="fm-g" title="${esc(it.n)}"><img class="q${it.q}" src="${esc(it.i)}" alt="" loading="lazy"><b class="q${it.q}">${esc(it.n)}</b></span>`).join('')}</div>` : ''}
    </a>`;
  }
  function render() {
    const chip = (k, lb) => `<button class="vc-btn fm-sort${sort === k ? ' on' : ''}" data-sort="${k}">${lb}</button>`;
    app.innerHTML = `<div class="vc-top">
        <div class="vc-ttl"><b>파밍 빌드 공유</b><small>허공의 성도 재능 별무리 배치</small></div>
        <div class="fm-sorts">${chip('likes', '추천순')}${chip('views', '조회순')}${chip('new', '최신순')}</div>
        <div class="vc-acts"><input class="fm-q" type="search" placeholder="제목·작성자 검색" value="${esc(q)}"><a class="vc-btn vc-share" href="/tli/void/">📤 내 파밍 빌드 올리기</a></div>
      </div>
      <div class="fm-grid">${list.map(card).join('') || `<div class="vc-empty fm-empty">${busy ? '불러오는 중…' : q ? '검색 결과가 없습니다' : '아직 공유된 파밍 빌드가 없습니다 — 허공의 성도에서 노드를 찍고 「📤 파밍 빌드 공유」로 올려 보세요'}</div>`}</div>
      ${more ? '<div class="fm-morebar"><button class="vc-btn" data-more>더 보기</button></div>' : ''}`;
  }
  async function fetchList(append) {
    busy = true; if (!append) render();
    const p = new URLSearchParams({ sort, offset: append ? list.length : 0 }); if (q) p.set('q', q);
    try {
      const r = await (await fetch('/api/vshares?' + p)).json();
      if (r.ok) { list = append ? list.concat(r.list) : r.list; more = r.more; }
    } catch (e) {}
    busy = false; render();
  }
  app.addEventListener('click', e => {
    const s = e.target.closest('[data-sort]');
    if (s) { sort = s.dataset.sort; try { localStorage.setItem('tli_farm_ui_v1', JSON.stringify({ sort })); } catch (e2) {} fetchList(); return; }
    if (e.target.closest('[data-more]')) fetchList(true);
  });
  let qt;
  app.addEventListener('input', e => {
    if (!e.target.classList.contains('fm-q')) return;
    clearTimeout(qt); qt = setTimeout(() => { q = e.target.value.trim(); fetchList().then(() => { const el = app.querySelector('.fm-q'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }); }, 350);
  });
  fetchList();
})();
