// 생성물 — 고칠 땐 update/src/farm_page.js (build_html2.build_tool_pages)
// 파밍 빌드 공유 목록 (/tli/farm, 2026-10-16) — 허공의 성도 배치 공유 글(/api/vshares)을 추천·조회·최신순으로. 글을 누르면 /tli/void/?s=ID
(function () {
  'use strict';
  const ICON = 'https://cdn.tlidb.com/UI/Textures/Common/Icon/TalentPoint/128/';
  const app = document.getElementById('farmApp');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const BYKEY = new Map(VOID.list.map(c => [Math.floor(+c.start / 100), c]));
  const kday = iso => iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 10) : '';
  // 디스코드로 인증된 작성자 마크 (2026-10-30)
  const DC_MARK = '<svg class="wt-dc" viewBox="0 0 127 96" aria-hidden="true"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg>';

  let sort = 'likes', q = '', list = [], more = false, busy = false;
  // 거르기 칩 (2026-10-30 사용자) — 난이도는 여러 개(하나라도 맞으면), 정령 필수는 하나만. 둘 다 '안 고름' 이 기본.
  // 값은 서버 tli_api.js 의 FARM_TIERS·FARM_PACTS 와 같아야 한다.
  const FARM_TIERS = ['7티어', '8티어', '아득', '딥스'];
  let fTiers = new Set(), fPact = '';
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
  /** 글에 달린 난이도·정령 필수 칩 */
  function farmTags(x) {
    let ts = []; try { ts = JSON.parse(x.tiers || '[]'); } catch (e) {}
    if (!ts.length && !x.pact) return '';
    return '<div class="fm-tags">'
      + ts.map(t => `<span class="fm-tg">${esc(t)}</span>`).join('')
      + (x.pact ? `<span class="fm-tg pact${x.pact === 'O' ? ' need' : ''}">정령 ${x.pact === 'O' ? '필요' : '불필요'}</span>` : '')
      + '</div>';
  }
  function card(x) {
    let pts = []; try { pts = JSON.parse(x.pts || '[]') || []; } catch (e) {}
    const cs = pts.map(([k, n]) => [BYKEY.get(k), n]).filter(p => p[0]).sort((a, b) => b[1] - a[1]);
    const tot = cs.reduce((t, p) => t + p[1], 0), gs = gearOf(x.code);
    return `<a class="fm-card" href="/tli/void/?s=${encodeURIComponent(x.id)}">
      <div class="fm-t"><b data-noi18n>${esc(x.title)}</b>${x.hv ? '<span class="fm-v">🎬 영상</span>' : ''}</div>
      ${farmTags(x)}
      <div class="fm-m">${x.au
        ? `<span class="fm-who" data-noi18n role="link" tabindex="0" title="디스코드로 인증된 작성자 — 누르면 이 사람이 쓴 글 모아보기" data-au="${esc(x.au)}">${DC_MARK}${esc(x.author)}</span>`
        : `<span data-noi18n>👤 ${esc(x.author)}</span>`}<span>${kday(x.created_at)}</span><span>👍 ${x.likes || 0}</span><span>👁 ${x.views || 0}</span></div>
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
      <div class="fm-filter">
        <span class="fm-fl">난이도</span>
        ${FARM_TIERS.map(t => `<button class="fm-fc${fTiers.has(t) ? ' on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}
        <span class="fm-fl sp">정령 필수</span>
        <button class="fm-fc${fPact === 'O' ? ' on' : ''}" data-p="O">필요함</button>
        <button class="fm-fc${fPact === 'X' ? ' on' : ''}" data-p="X">없어도 됨</button>
        ${fTiers.size || fPact ? '<button class="fm-fc clr" data-fclr>✕ 조건 지우기</button>' : ''}
      </div>
      <div class="fm-grid">${list.map(card).join('') || `<div class="vc-empty fm-empty">${busy ? '불러오는 중…' : (q || fTiers.size || fPact) ? '조건에 맞는 파밍 빌드가 없습니다' : '아직 공유된 파밍 빌드가 없습니다 — 허공의 성도에서 노드를 찍고 「📤 파밍 빌드 공유」로 올려 보세요'}</div>`}</div>
      ${more ? '<div class="fm-morebar"><button class="vc-btn" data-more>더 보기</button></div>' : ''}`;
  }
  async function fetchList(append) {
    busy = true; if (!append) render();
    const p = new URLSearchParams({ sort, offset: append ? list.length : 0 }); if (q) p.set('q', q);
    if (fTiers.size) p.set('t', [...fTiers].join(','));
    if (fPact) p.set('p', fPact);
    try {
      const r = await (await fetch('/api/vshares?' + p)).json();
      if (r.ok) { list = append ? list.concat(r.list) : r.list; more = r.more; }
    } catch (e) {}
    busy = false; render();
  }
  app.addEventListener('click', e => {
    // 인증 작성자 — 카드 전체가 이미 <a> 라서 안에 <a> 를 또 넣으면 브라우저가 카드를 찢는다(2026-10-30).
    // 그래서 span 으로 두고 여기서 가로채 이동한다.
    const who = e.target.closest('[data-au]');
    if (who) { e.preventDefault(); e.stopPropagation(); location.href = '/tli/u/?k=' + encodeURIComponent(who.dataset.au); return; }
    const ft = e.target.closest('[data-t]');
    if (ft) { const t = ft.dataset.t; fTiers.has(t) ? fTiers.delete(t) : fTiers.add(t); fetchList(); return; }
    const fp = e.target.closest('[data-p]');
    if (fp) { fPact = fPact === fp.dataset.p ? '' : fp.dataset.p; fetchList(); return; }   // 다시 누르면 해제
    if (e.target.closest('[data-fclr]')) { fTiers.clear(); fPact = ''; fetchList(); return; }
    const s = e.target.closest('[data-sort]');
    if (s) { sort = s.dataset.sort; try { localStorage.setItem('tli_farm_ui_v1', JSON.stringify({ sort })); } catch (e2) {} fetchList(); return; }
    if (e.target.closest('[data-more]')) fetchList(true);
  });
  app.addEventListener('keydown', e => {   // 키보드로도 (role=link, tabindex=0)
    const who = e.target.closest && e.target.closest('[data-au]');
    if (who && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.href = '/tli/u/?k=' + encodeURIComponent(who.dataset.au); }
  });
  let qt;
  app.addEventListener('input', e => {
    if (!e.target.classList.contains('fm-q')) return;
    clearTimeout(qt); qt = setTimeout(() => { q = e.target.value.trim(); fetchList().then(() => { const el = app.querySelector('.fm-q'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }); }, 350);
  });
  fetchList();
})();
