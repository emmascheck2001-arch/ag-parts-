function machineText(machine = {}) {
  return `${machine.manufacturer || ""} ${machine.displayName || ""} ${machine.machineType || ""}`.toLowerCase();
}

export function isMacDonMachine(machine) {
  return /macdon/.test(machineText(machine));
}

export function isHarvestFocusMachine(machine) {
  return /macdon|header|draper|adapter|windrower|pickup/.test(machineText(machine));
}

export function marketFocusRank(machine) {
  if (isMacDonMachine(machine) && isHarvestFocusMachine(machine)) return 0;
  if (isHarvestFocusMachine(machine)) return 1;
  return 2;
}

export function sortMachinesForMarketFocus(machines = []) {
  return [...machines].sort((a, b) =>
    marketFocusRank(a) - marketFocusRank(b) ||
    String(a.manufacturer || "").localeCompare(String(b.manufacturer || "")) ||
    String(a.displayName || "").localeCompare(String(b.displayName || ""))
  );
}

export function marketFocusLabel(machine) {
  if (isMacDonMachine(machine) && isHarvestFocusMachine(machine)) return "MacDon harvest focus";
  if (isHarvestFocusMachine(machine)) return "Harvest focus";
  return "Verified machine";
}
