// Prints a receipt and the rival radar so you can see the numbers. Run: node scripts/show-examples.mjs
import { PRESET_TEAMS } from "../src/data/fanTeams.js";
import { eventReceipt, radar, fmt, signed } from "../src/engine.js";

const [paltan, yellow] = PRESET_TEAMS;

function show(r, title) {
  console.log(`\n${title}`);
  for (const p of r.parts) console.log(`   ${signed(p.pts).padStart(6)}  ${p.label}`);
  console.log(`   ${"=".padStart(6)}  ${fmt(r.base)} points${r.mult !== 1 ? `, x${r.mult} (${r.mult === 2 ? "captain" : "vice-captain"}) = ${fmt(r.total)}` : ""}`);
  for (const n of r.notes) console.log(`   note: ${n}`);
}

console.log("RECEIPTS for MI Paltan");
show(eventReceipt(paltan, "rickelton", 1), "Rickelton at over 6.4 (captain)");
show(eventReceipt(paltan, "dhir", 4), "Dhir at over 16.5 (vice-captain)");
show(eventReceipt(paltan, "suryakumar", 2), "Suryakumar at over 10.4");

console.log("\nRIVAL RADAR, MI Paltan vs Yellow Army, final");
const r = radar(paltan, yellow, 10);
console.log(`Lead: ${fmt(r.lead)}\n`);
console.log("Player              Group   You     Rival   Net");
for (const x of r.rows) console.log(`${x.name.padEnd(19)} ${x.group.padEnd(7)} ${fmt(x.mine).padStart(5)}   ${fmt(x.theirs).padStart(5)}   ${signed(x.net).padStart(6)}`);
