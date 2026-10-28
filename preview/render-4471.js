// Generate a portable HTML view of the signed KB page from the same exported data.
// Run from support-kb: node preview/render-4471.js
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const reports = require(path.join(root, 'src/lib/data/reports-4471.json'));
const notes = require(path.join(root, 'src/lib/data/desk-notes.json'));
const tenants = Object.fromEntries(fs.readdirSync(path.join(root, 'src/lib/data/tenants'))
  .map((file) => require(path.join(root, 'src/lib/data/tenants', file)))
  .map((tenant) => [tenant.handle, tenant]));
const signature = 'OpenCode harness · S01E03';
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function fnv1a(text, seed) {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}
let bits = (BigInt(fnv1a(signature.trim(), 0x811c9dc5)) << 8n) |
  BigInt(fnv1a(signature.trim(), 0x9e3779b9) & 0xff);
let ref = '';
for (let i = 0; i < 8; i++) {
  ref = alphabet[Number(bits & 31n)] + ref;
  bits >>= 5n;
}
ref = `DR-${ref.slice(0, 4)}-${ref.slice(4)}`;

const merged = [...new Map(reports.map((report) => [report.id, report])).values()]
  .filter((report) => report.mergedInto === 4471);
const groups = new Map();
for (const report of merged) {
  const tenant = tenants[report.tenant];
  const order = tenant && new Intl.DateTimeFormat(tenant.locale, {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(Date.UTC(2026, 0, 2, 12))).map((part) => part.type);
  const cause = !tenant || order.indexOf('day') > order.indexOf('month') ? 'unplaced'
    : report.channel === 'form' && tenant.form === 'booking-v3' ? 'hint' : 'parser';
  if (!groups.has(cause)) groups.set(cause, []);
  groups.get(cause).push(report);
}
const rows = [...groups].sort((a, b) => b[1].length - a[1].length).map(([cause, group]) => {
  const tags = Object.entries(group.reduce((counts, report) => {
    counts[report.meta.intakeTag] = (counts[report.meta.intakeTag] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).map(([tag, count]) => `${tag} ×${count}`).join(' · ');
  const dates = group.map((report) => report.receivedAt.slice(0, 10)).sort();
  const moved = group.filter((report) => notes.oneDayMove.includes(report.id)).length;
  return `<tr${cause !== 'parser' ? ' class="wrong"' : ''}><td><code>${cause}</code></td><td>${group.length}</td><td>${tags}</td><td>${new Set(group.map((report) => report.tenant)).size}</td><td>${dates[0]} → ${dates.at(-1)}</td><td>${cause === 'parser' ? '#4471' : 'not this ticket — no ticket of its own'}</td></tr>${moved ? `<tr><td colspan="6" class="note">${moved} reports read as a one-day move; filed under <code>${cause}</code> by tenant.</td></tr>` : ''}`;
}).join('\n');

const week = 7 * 86_400_000;
const from = Date.parse('2026-03-30');
const weeks = Array.from({ length: Math.ceil((Date.parse('2026-10-05') - from) / week) },
  (_, i) => ({ at: from + i * week, received: 0, merged: 0 }));
for (const report of merged) {
  for (const [field, count] of [['receivedAt', 'received'], ['mergedAt', 'merged']]) {
    if (!report[field]) continue;
    const i = Math.floor((Date.parse(report[field].slice(0, 10)) - from) / week);
    if (weeks[i]) weeks[i][count]++;
  }
}
const max = Math.max(...weeks.flatMap((row) => [row.received, row.merged]));
const bars = weeks.map((row, i) => {
  const received = row.received / max * 100;
  const merged = row.merged / max * 100;
  const label = i % 4 === 0 ? `<text x="${i * 24 + 12}" y="128">${new Date(row.at).toISOString().slice(5, 10)}</text>` : '';
  return `<rect class="in" x="${i * 24 + 2}" y="${110 - received}" width="9" height="${received}"/><rect class="merged" x="${i * 24 + 12}" y="${110 - merged}" width="9" height="${merged}"/>${label}`;
}).join('');

const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>#4471 · two causes behind the merged date reports · support kb</title>
<style>
:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a66;--line:#e3e0d8;--accent:#2f6f5e;--warn:#b4501f;--warn-bg:#fbeee6;--mono:ui-monospace,'Cascadia Code',Menlo,monospace}
@media(prefers-color-scheme:dark){:root{--bg:#171716;--fg:#ecebe6;--muted:#9c9a93;--line:#34332f;--accent:#6fbfa6;--warn:#f0905d;--warn-bg:#3a2418}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:2rem 16px 4rem}a{color:var(--accent)}h1{line-height:1.2;margin:.25rem 0 .5rem}.meta,.note{color:var(--muted);font-size:.85rem}.meta{display:flex;gap:1rem;flex-wrap:wrap}.status{border:1px solid var(--line);border-radius:99px;padding:0 .6rem}table{border-collapse:collapse;width:100%;font-size:.92rem}th,td{padding:.35rem .5rem;border-bottom:1px solid var(--line);text-align:left}.wide{overflow-x:auto}.wrong{background:var(--warn-bg)}code,.stamp{font-family:var(--mono)}.stamp{margin-top:2rem;color:var(--muted)}.stamp b{color:var(--accent)}svg{width:100%;max-width:640px}.in{fill:var(--warn)}.merged{fill:var(--accent)}svg text{font:8px var(--mono);fill:var(--muted);text-anchor:middle}footer{margin-top:3rem;border-top:1px solid var(--line);padding-top:1rem;color:var(--muted);font-size:.8rem}
</style>
<main><header><a href="../src/routes/kb/+page.svx">support desk · kb</a>
<h1>#4471 · two causes behind the merged date reports</h1><p class="meta"><span>owner <b>OpenCode harness</b></span><span class="status">reviewed</span><span>reviewed 2026-10-28</span></p></header>
<p>The desk marked #4471 as one known month/day parsing issue. The merged reports instead describe <strong>two different causes</strong>. Count distinct report IDs, not export rows: the ticket system's export pages overlap. Classify by each tenant's locale and booking form, not the browser-derived intake tag or the report's subject.</p>
<h2>The two problems</h2><ol>
<li><strong>Month-first shared parser for day-first tenants (<code>parser</code>).</strong> The shared parser reads dates as MM/DD even when the tenant writes DD/MM. This is the main cause behind #4471. Repair the parser's handling of the tenant's date order.</li>
<li><strong>Misleading date hint in booking-v3 (<code>hint</code>).</strong> For day-first tenants, booking-v3 prints MM/DD/YYYY under the date field. People enter the date month-first as instructed, but the form interprets it in the tenant's day-first order. Correct the displayed hint to match the date order that the form actually reads. This needs its own ticket and fix.</li></ol>
<p>The table below computes the number of reports for each cause from the exported data. Its <em>tagged as</em> column shows intake guesses, not the actual cause. Reports described by the desk as a one-day move remain filed under their tenant-derived cause and are footnoted there; they do not form a third cause on this evidence.</p>
<p><strong>${merged.length}</strong> reports merged into #4471 · <strong>${groups.size}</strong> causes</p>
<div class="wide"><table><thead><tr><th>cause</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Queue history</h2><p>The reports arrived from April onward, but their merge dates differ. The chart keeps received and merged separate rather than treating the merge date as when the bug began.</p>
<figure><svg viewBox="0 0 ${weeks.length * 24} 140" role="img" aria-label="reports received and merged into #4471, per week">${bars}</svg><figcaption><span style="color:var(--warn)">■</span> received · <span style="color:var(--accent)">■</span> merged into #4471 · per week</figcaption></figure>
<h2>Triage correction</h2><p>The existing subject-line dedupe rule cannot establish that two reports have the same cause. Keep the parser reports together under #4471, separate the booking-v3 hint reports, and reconcile each ticket's count from distinct report IDs. Do not close the second issue when the parser fix ships: test the form hint and parsing independently for a day-first tenant.</p>
<p class="stamp">desk ref <b>${ref}</b></p><footer>Pages are written by people. Tables and charts are built from data at render time. This portable HTML is a snapshot of the exported data; the .svx source renders the live components.</footer></main></html>\n`;
fs.writeFileSync(path.join(__dirname, '4471-split.html'), html);
console.log(JSON.stringify({ unique: merged.length, groups: Object.fromEntries([...groups].map(([cause, group]) => [cause, group.length])), ref }));
