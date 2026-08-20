/** production-monitor.js
 * Measures player money change over a given interval (seconds).
 * Usage:
 *   run production-monitor.js 60    # measure for 60 seconds
 */

/**
 * Format a value with the Bitburner v3.0.0+ ns.format API.
 * Accepts a numeral-style format string (e.g. "$0.00a"): the "$" prefix
 * and the decimal count are honored, suffixes come from ns.format.number.
 * @param {NS} ns
 * @param {number} value
 * @param {string} format
 */
function formatMoney(ns, value, format = "$0.00a") {
  const match = format.match(/\.(0+)/);
  const decimals = match ? match[1].length : 0;
  const sign = value < 0 ? "-" : "";
  const currency = format.includes("$") ? "$" : "";
  return sign + currency + ns.format.number(Math.abs(value), decimals);
}

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("sleep");
  const secs = Number(ns.args[0]) || 60;
  const start = ns.getPlayer().money;
  ns.tprint(`Monitoring production for ${secs}s... start=${formatMoney(ns, start, "$0.00a")}`);
  for (let i = 0; i < secs; i++) {
    await ns.sleep(1000);
    // optional per-second print:
    // ns.tprint(`${i+1}s`);
  }
  const end = ns.getPlayer().money;
  const gained = end - start;
  const perSec = gained / secs;
  ns.tprint(`Done: gained ${formatMoney(ns, gained, "$0.00a")} over ${secs}s (${formatMoney(ns, perSec, "$0.00a")}/s)`);
}
