'use strict';

const id = new URLSearchParams(location.search).get('id');
if (!id) location.href = '/';

let matchData = null;
let pollTimer = null;

// ── Event code → display ──────────────────────────────────────────────────────
const EV_TYPE = {
  'T':  'try',          'C':  'conversion', 'P':  'penalty_goal',
  'DG': 'drop_goal',    'PT': 'penalty_try',
  'YC': 'yellow_card',  'RC': 'red_card',
  'KO': 'match_start',  'HT': 'half_time',
  '2H': 'second_half_start', 'FT': 'match_end',
};
const EV_LABEL = {
  try: 'Try', conversion: 'Conversion', penalty_goal: 'Penalty',
  drop_goal: 'Drop Goal', penalty_try: 'Penalty Try',
  yellow_card: 'Sin Bin', red_card: 'Red Card',
  match_start: 'Kick Off', half_time: 'Half Time',
  second_half_start: '2nd Half', match_end: 'Full Time',
};
const EV_COLOR = {
  try: 'var(--try-c)', conversion: 'var(--pen-c)', penalty_goal: 'var(--pen-c)',
  drop_goal: 'var(--pen-c)', penalty_try: 'var(--try-c)',
  yellow_card: 'var(--ycard)', red_card: 'var(--rcard)',
};
const EV_PTS = {
  try: '+5', conversion: '+2', penalty_goal: '+3',
  drop_goal: '+3', penalty_try: '+7',
};
const NEUTRAL = new Set(['match_start','half_time','second_half_start','match_end']);

// ── Init ─────────────────────────────────────────────────────────────────────
async function load() {
  try {
    const r = await fetch(`/api/sevens/match/${id}`);
    if (!r.ok) throw new Error(r.status);
    matchData = await r.json();
    document.title = `${matchData.home_name} v ${matchData.away_name}`;
    renderScoreboard();
    renderTimeline();
    schedulePoll();
  } catch (e) {
    document.getElementById('timeline').innerHTML =
      `<li class="tl-empty">Could not load match.<br><small>${e}</small></li>`;
  }
}

function schedulePoll() {
  clearTimeout(pollTimer);
  if (matchData && matchData.status === 'active') {
    pollTimer = setTimeout(load, 2000);
  }
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function renderScoreboard() {
  const m  = matchData;
  const up = m.status === 'scheduled';
  const badge =
    m.status === 'active'    ? `<span class="badge live"><span class="dot"></span>${activeBadgeText(m)}</span>` :
    m.status === 'completed' ? `<span class="badge finished">FULL TIME</span>` :
                               `<span class="badge upcoming">PENDING</span>`;

  document.getElementById('scoreboard').innerHTML = `
    <div class="sb-team home">
      <div class="sb-stripe" style="background:${m.home_color || '#555'}"></div>
      <div class="sb-name">${m.home_name}</div>
      <div class="sb-abbr">${m.home_abbr || ''}</div>
    </div>
    <div class="sb-center">
      <div class="sb-scores">
        <span class="sb-score">${up ? '–' : m.home_score}</span>
        <span class="sb-sep">–</span>
        <span class="sb-score">${up ? '–' : m.away_score}</span>
      </div>
      ${badge}
      <div class="sb-venue">${m.stage || ''}</div>
    </div>
    <div class="sb-team away">
      <div class="sb-stripe" style="background:${m.away_color || '#555'}"></div>
      <div class="sb-name">${m.away_name}</div>
      <div class="sb-abbr">${m.away_abbr || ''}</div>
    </div>`;
}

function activeBadgeText(m) {
  const last = [...(m.events || [])].reverse().find(e =>
    ['KO','HT','2H'].includes(e.event_code));
  if (!last) return 'LIVE';
  if (last.event_code === 'HT') return 'HALF TIME';
  if (last.event_code === '2H') return '2nd HALF';
  return '1st HALF';
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function renderTimeline() {
  const el = document.getElementById('timeline');
  const evs = matchData.events || [];

  if (!evs.length) {
    el.innerHTML = `<li class="tl-empty">
      No events yet.${matchData.status === 'scheduled' ? '<br>Events appear once the match starts.' : ''}
    </li>`;
    return;
  }

  el.innerHTML = evs.map(tlItem).join('');
}

function tlItem(ev) {
  const type  = EV_TYPE[ev.event_code] || ev.event_code;
  const label = EV_LABEL[type] || ev.event_label || type;
  const color = EV_COLOR[type] || 'var(--border)';
  const pts   = EV_PTS[type];
  const t     = ev.time_display || `${Math.floor(ev.elapsed_secs / 60)}:${String(Math.floor(ev.elapsed_secs % 60)).padStart(2,'0')}`;
  const dot   = `<div class="tl-dot ${type}">${dotLabel(ev)}</div>`;

  if (NEUTRAL.has(type)) {
    return `<li class="tl-item is-neutral">
      ${dot}
      <div class="neutral-pill">${label}</div>
    </li>`;
  }

  const playerLine = ev.player_name
    ? `<div class="ev-player">${ev.player_name}</div>`
    : ev.player_number != null
      ? `<div class="ev-player">#${ev.player_number}</div>`
      : '';

  const card = `<div class="ev-card" style="--ec:${color}">
    <div class="ev-type">${label}</div>
    ${playerLine}
    <div class="ev-desc">${t}</div>
    ${pts ? `<div class="ev-pts">${pts} pts</div>` : ''}
  </div>`;

  if (ev.team_side === 'home') {
    return `<li class="tl-item">
      <div class="tl-home">${card}</div>
      <div class="tl-spine">${dot}</div>
      <div class="tl-away"></div>
    </li>`;
  }
  return `<li class="tl-item">
    <div class="tl-home"></div>
    <div class="tl-spine">${dot}</div>
    <div class="tl-away">${card}</div>
  </li>`;
}

function dotLabel(ev) {
  const code = ev.event_code;
  if (code === 'KO') return 'KO';
  if (code === 'HT') return 'HT';
  if (code === '2H') return '2H';
  if (code === 'FT') return 'FT';
  const m = Math.floor((ev.elapsed_secs || 0) / 60);
  return `${m}'`;
}

load();
