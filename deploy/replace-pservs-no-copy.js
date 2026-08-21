/** replace-pservs-no-copy.js
 * Replace purchased servers with upgraded RAM.
 * Usage: run replace-pservs-no-copy.js [RAM_SIZE]
 * Example: run replace-pservs-no-copy.js 32
 * 
 * If no RAM size is specified, shows current status and available options.
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
  ns.disableLog("kill");

  const pservs = ns.cloud.getServerNames();
  const currentMoney = ns.getPlayer().money;

  // Get current RAM size (check first server)
  let currentRAM = 0;
  if (pservs.length > 0) {
    currentRAM = ns.getServerMaxRam(pservs[0]);
  }

  // Available RAM options (must be powers of 2)
  const ramOptions = [8, 16, 32, 64, 128, 256, 512, 1024];
  
  // Get target RAM from argument
  const targetRAM = ns.args[0] ? parseInt(ns.args[0]) : null;

  ns.tprint("═══════════════════════════════════════════════════");
  ns.tprint("  SERVER UPGRADE TOOL");
  ns.tprint("═══════════════════════════════════════════════════");
  ns.tprint(`Current servers: ${pservs.length}/25`);
  ns.tprint(`Current RAM per server: ${currentRAM}GB`);
  ns.tprint(`Current money: ${formatMoney(ns, currentMoney, "$0.00a")}`);
  ns.tprint("");

  // If no target specified, show options
  if (!targetRAM) {
    ns.tprint("Available upgrade options:");
    ns.tprint("");
    ns.tprint("RAM | Cost/Server | Total Cost | Status");
    ns.tprint("----+-------------+------------+--------");
    
    for (const ram of ramOptions) {
      if (ram <= currentRAM) continue; // Skip downgrades and same size
      
      const cost = ns.cloud.getServerCost(ram);
      const totalCost = cost * pservs.length;
      const canAfford = currentMoney >= totalCost;
      const status = canAfford ? "✓ Can afford" : "✗ Too expensive";
      const multiplier = ram / currentRAM;
      
      ns.tprint(
        `${ram.toString().padStart(4)}GB | ${formatMoney(ns, cost, "$0.00a").padStart(11)} | ` +
        `${formatMoney(ns, totalCost, "$0.00a").padStart(10)} | ${status} (${multiplier}x RAM)`
      );
    }
    
    ns.tprint("");
    ns.tprint("Usage: run replace-pservs-no-copy.js [RAM_SIZE]");
    ns.tprint("Example: run replace-pservs-no-copy.js 32");
    return;
  }

  // Validate target RAM
  if (!ramOptions.includes(targetRAM)) {
    ns.tprint(`✗ Invalid RAM size: ${targetRAM}GB`);
    ns.tprint(`Valid options: ${ramOptions.join(", ")}`);
    return;
  }

  if (targetRAM <= currentRAM) {
    ns.tprint(`✗ Cannot downgrade or use same size!`);
    ns.tprint(`Current: ${currentRAM}GB, Target: ${targetRAM}GB`);
    return;
  }

  // Calculate costs
  const cost = ns.cloud.getServerCost(targetRAM);
  const totalCost = cost * pservs.length;

  ns.tprint(`Upgrading to: ${targetRAM}GB RAM (${targetRAM / currentRAM}x increase)`);
  ns.tprint(`Cost per server: ${formatMoney(ns, cost, "$0.00a")}`);
  ns.tprint(`Total cost: ${formatMoney(ns, totalCost, "$0.00a")}`);
  ns.tprint(`Remaining after upgrade: ${formatMoney(ns, currentMoney - totalCost, "$0.00a")}`);
  ns.tprint("");

  // Check if can afford
  if (currentMoney < totalCost) {
    ns.tprint(`✗ Insufficient funds!`);
    ns.tprint(`Need: ${formatMoney(ns, totalCost, "$0.00a")}`);
    ns.tprint(`Have: ${formatMoney(ns, currentMoney, "$0.00a")}`);
    ns.tprint(`Short: ${formatMoney(ns, totalCost - currentMoney, "$0.00a")}`);
    return;
  }

  // Proceed with upgrade
  ns.tprint("Starting upgrade process...");
  ns.tprint("");

  let replaced = 0;
  let failed = 0;

  for (const pserv of pservs) {
    try {
      // Kill any running scripts
      ns.killall(pserv);
      
      // Delete the server
      const deleted = ns.cloud.deleteServer(pserv);
      if (!deleted) {
        ns.tprint(`✗ Failed to delete ${pserv}`);
        failed++;
        continue;
      }

      // Purchase new server with same name
      const purchased = ns.cloud.purchaseServer(pserv, targetRAM);
      if (purchased) {
        ns.tprint(`✓ Upgraded ${pserv}: ${currentRAM}GB → ${targetRAM}GB`);
        replaced++;
      } else {
        ns.tprint(`✗ Failed to purchase new ${pserv}`);
        failed++;
      }

      await ns.sleep(100);
    } catch (e) {
      ns.tprint(`✗ Error replacing ${pserv}: ${e}`);
      failed++;
    }
  }

  ns.tprint("");
  ns.tprint("═══════════════════════════════════════════════════");
  ns.tprint(`Upgrade complete: ${replaced} successful, ${failed} failed`);
  ns.tprint(`New total RAM: ${ns.format.ram(replaced * targetRAM, 2)}`);
  ns.tprint("═══════════════════════════════════════════════════");
  ns.tprint("");
  ns.tprint("✓ Batch-manager should auto-detect the upgraded servers on its next cycle.");
  ns.tprint("  If it doesn't restart automatically, you can manually restart:");
  ns.tprint("  1. Kill all processes: run utils/global-kill.js");
  ns.tprint("  2. Restart batch manager: run batch/batch-manager.js joesguns --quiet");
}
