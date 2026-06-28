'use strict';

let tournament = null;
let schedule   = [];

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function load() {
  try {
    const [tr, sr] = await Promise.all([
      fetch('/api/sevens/tournament').then(r => r.json()),
      fetch('/api/sevens/schedule').then(r => r.json()),
    ]);
    tournament = tr;
    schedule   = Array.isArray(sr) ? sr : [];
    render();
  } catch {
    document.getElementById('no-tourn').style.display = '';
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  if (!tournament) {
    document.getElementById('no-tourn').style.display = '';
    return;
  }

  renderHeader();
  renderSchedule();

  const hasLive = schedule.some(m => m.status === 'active');
  clearTimeout(render._t);
  render._t = setTimeout(load, hasLive ? 5000 : 15000);
}

function renderHeader() {
  const el = document.getElementById('tourn-header');
  el.style.display = '';
  const liveCount = schedule.filter(m => m.status === 'active').length;
  el.innerHTML = `
    <div class="tourn-name">${tournament.name || 'Tournament'}</div>
    <div class="tourn-meta">
      <span>📍 ${tournament.venue || ''}</span>
      <span>${tournament.team_count || ''} teams · ${tournament.pool_count || ''} pools</span>
      ${liveCount ? `<span class="badge live" style="font-size:11px"><span class="dot"></span>${liveCount} LIVE</span>` : ''}
    </div>`;
}

function renderSchedule() {
  const el = document.getElementById('schedule');
  if (!schedule.length) {
    el.innerHTML = '<p class="tl-empty">No matches scheduled yet.</p>';
    return;
  }

  // Group by stage prefix so pool rounds flow together, then knockout rounds
  const groups = [];
  let current = null;

  for (const m of schedule) {
    const key = stageGroup(m.stage);
    if (!current || current.key !== key) {
      current = { key, label: stageGroupLabel(m.stage), matches: [] };
      groups.push(current);
    }
    current.matches.push(m);
  }

  el.innerHTML = groups.map(g => `
    <div class="stage-group">
      <div class="stage-sep">${g.label}</div>
      ${g.matches.map(matchRow).join('')}
    </div>`).join('');
}

function stageGroup(stage) {
  if (stage.startsWith('Pool ')) return '__pools__';
  return stage;
}

function stageGroupLabel(stage) {
  if (stage.startsWith('Pool ')) return 'Pool Stage';
  const s = stage.toLowerCase();
  if (s.includes('final') && !s.includes('sf') && !s.includes('qf')) {
    if (s.includes('3rd'))   return '3rd Place';
    if (s.includes('5th'))   return '5th Place';
    if (s.includes('cup'))   return 'Cup Final';
    if (s.includes('plate')) return 'Plate Final';
    if (s.includes('bowl'))  return 'Bowl Final';
    return stage;
  }
  if (s.startsWith('qf')) return s.includes('cup') ? 'Cup Quarter-Finals' : s.includes('plate') ? 'Plate Quarter-Finals' : 'Bowl Quarter-Finals';
  if (s.startsWith('sf')) return s.includes('cup') ? 'Cup Semi-Finals'    : s.includes('plate') ? 'Plate Semi-Finals'    : 'Bowl Semi-Finals';
  return stage;
}

function matchRow(m) {
  const isPending   = m.status === 'scheduled';
  const isLive      = m.status === 'active';
  const isCompleted = m.status === 'completed';

  const badge = isLive
    ? `<span class="badge live"><span class="dot"></span>${halfLabel(m)}</span>`
    : isCompleted
      ? `<span class="badge finished">FT</span>`
      : `<span class="badge upcoming">Pending</span>`;

  const scoreH = isPending ? '–' : m.home_score;
  const scoreA = isPending ? '–' : m.away_score;

  const isPlaceholder = !m.home_name || m.home_name === 'TBD';

  return `
<a class="sched-row ${m.status}" href="/match.html?id=${m.id}">
  <div class="sr-stage">${m.stage}</div>
  <div class="sr-body">
    <div class="sr-team home">
      <span class="sr-color" style="background:${m.home_color || '#555'}"></span>
      <span class="sr-name">${m.home_name || 'TBD'}</span>
    </div>
    <div class="sr-score ${isPlaceholder ? 'placeholder' : ''}">
      <span>${scoreH}</span>
      <span class="sr-dash">–</span>
      <span>${scoreA}</span>
    </div>
    <div class="sr-team away">
      <span class="sr-name">${m.away_name || 'TBD'}</span>
      <span class="sr-color" style="background:${m.away_color || '#555'}"></span>
    </div>
  </div>
  <div class="sr-badge">${badge}</div>
</a>`;
}

function halfLabel(m) {
  if (!m.match_running && m.current_half) return 'LIVE';
  const half = (m.current_half || '').toLowerCase();
  const t    = m.remaining_display || '';
  if (half === 'first')      return `1H ${t}`;
  if (half === 'second')     return `2H ${t}`;
  if (half === 'extratime')  return `ET ${t}`;
  return 'LIVE';
}

load();
