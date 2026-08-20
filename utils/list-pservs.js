/** list-pservs.js
 * List all purchased servers and their status.
 * Usage: run list-pservs.js
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

  const pservs = ns.cloud.getServerNames();
  
  ns.tprint("Purchased Servers:");
  ns.tprint("Name | RAM | Used | Free | Root | Money");
  ns.tprint("-----|-----|------|------|------|------");

  for (const pserv of pservs) {
    try {
      const maxRam = ns.getServerMaxRam(pserv);
      const usedRam = ns.getServerUsedRam(pserv);
      const freeRam = maxRam - usedRam;
      const hasRoot = ns.hasRootAccess(pserv);
      const money = ns.getServerMoneyAvailable(pserv);
      
      ns.tprint(`${pserv} | ${maxRam}GB | ${usedRam.toFixed(2)}GB | ${freeRam.toFixed(2)}GB | ${hasRoot ? "YES" : "NO"} | ${formatMoney(ns, money, "$0.00a")}`);
    } catch (e) {
      ns.tprint(`${pserv} | ERROR: ${e}`);
    }
  }
}
