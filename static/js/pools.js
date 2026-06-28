'use strict';

async function load() {
  try {
    const pools = await fetch('/api/sevens/pools').then(r => r.json());
    render(Array.isArray(pools) ? pools : []);
  } catch {
    document.getElementById('no-pools').style.display = '';
  }
}

function render(pools) {
  const el = document.getElementById('pools');
  if (!pools.length) {
    document.getElementById('no-pools').style.display = '';
    el.innerHTML = '';
  } else {
    document.getElementById('no-pools').style.display = 'none';
    el.innerHTML = pools.map(poolTable).join('');
  }

  // Standings only change once matches complete — a slower refresh is enough.
  clearTimeout(render._t);
  render._t = setTimeout(load, 15000);
}

function poolTable(p) {
  return `
<div class="stage-group">
  <div class="stage-sep">Pool ${p.pool}</div>
  <div class="pool-table">
    <div class="pool-row pool-head">
      <span class="pc-team">Team</span>
      <span class="pc-num">P</span>
      <span class="pc-num">W</span>
      <span class="pc-num">D</span>
      <span class="pc-num">L</span>
      <span class="pc-num">+/-</span>
      <span class="pc-num pc-pts">Pts</span>
    </div>
    ${p.standings.map(poolRow).join('')}
  </div>
</div>`;
}

function poolRow(s) {
  return `
    <div class="pool-row">
      <span class="pc-team">
        <span class="sr-color" style="background:${s.color || '#555'}"></span>
        <span class="sr-name">${s.position}. ${s.name}</span>
      </span>
      <span class="pc-num">${s.played}</span>
      <span class="pc-num">${s.won}</span>
      <span class="pc-num">${s.drawn}</span>
      <span class="pc-num">${s.lost}</span>
      <span class="pc-num">${s.points_diff > 0 ? '+' : ''}${s.points_diff}</span>
      <span class="pc-num pc-pts">${s.standing_points}</span>
    </div>`;
}

load();
