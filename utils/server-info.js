/** server-info.js
 * Display detailed information about a server.
 * Usage: run server-info.js [server]
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
  const target = ns.args[0] || ns.getHostname();
  
  try {
    const info = {
      name: target,
      maxMoney: ns.getServerMaxMoney(target),
      currentMoney: ns.getServerMoneyAvailable(target),
      maxRam: ns.getServerMaxRam(target),
      usedRam: ns.getServerUsedRam(target),
      freeRam: ns.getServerMaxRam(target) - ns.getServerUsedRam(target),
      minSecurity: ns.getServerMinSecurityLevel(target),
      currentSecurity: ns.getServerSecurityLevel(target),
      hackTime: ns.getHackTime(target),
      growTime: ns.getGrowTime(target),
      weakenTime: ns.getWeakenTime(target),
      hackChance: ns.hackAnalyzeChance(target),
      hackPercent: ns.hackAnalyze(target),
      hasRoot: ns.hasRootAccess(target),
      requiredPorts: ns.getServerNumPortsRequired(target),
      requiredHacking: ns.getServerRequiredHackingLevel(target)
    };

    ns.tprint(`\n=== Server Information: ${target} ===`);
    ns.tprint(`Money: ${formatMoney(ns, info.currentMoney, "$0.00a")} / ${formatMoney(ns, info.maxMoney, "$0.00a")} (${((info.currentMoney/info.maxMoney)*100).toFixed(1)}%)`);
    ns.tprint(`RAM: ${info.usedRam.toFixed(2)}GB / ${info.maxRam}GB (${info.freeRam.toFixed(2)}GB free)`);
    ns.tprint(`Security: ${info.currentSecurity.toFixed(2)} / ${info.minSecurity.toFixed(2)}`);
    ns.tprint(`Root Access: ${info.hasRoot ? "YES" : "NO"}`);
    ns.tprint(`Required Hacking Level: ${info.requiredHacking}`);
    ns.tprint(`Required Ports: ${info.requiredPorts}`);
    ns.tprint(`Hack Time: ${(info.hackTime/1000).toFixed(2)}s`);
    ns.tprint(`Grow Time: ${(info.growTime/1000).toFixed(2)}s`);
    ns.tprint(`Weaken Time: ${(info.weakenTime/1000).toFixed(2)}s`);
    ns.tprint(`Hack Chance: ${(info.hackChance*100).toFixed(1)}%`);
    ns.tprint(`Hack Percent: ${(info.hackPercent*100).toFixed(2)}%`);
    
    // Calculate profitability
    const expectedPerHack = info.maxMoney * info.hackPercent * info.hackChance;
    const moneyPerSecond = expectedPerHack / (info.hackTime / 1000);
    ns.tprint(`Expected per hack: ${formatMoney(ns, expectedPerHack, "$0.00a")}`);
    ns.tprint(`Money per second: ${formatMoney(ns, moneyPerSecond, "$0.00a")}/s`);
    
  } catch (e) {
    ns.tprint(`Error getting server info for ${target}: ${e}`);
  }
}
