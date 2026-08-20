export function formatUsdAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 1_000_000) throw new Error("invalid_usd_price");
  const raw = amount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  const [whole, frac = ""] = raw.split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}

export function formatX402Price(amount: number): string {
  return `$${formatUsdAmount(amount)}`;
}
