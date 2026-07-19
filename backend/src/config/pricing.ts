/** Tarification simplifiée et centralisée (cf. écran "Récapitulatif du paiement"). */
export const SERVICE_FEE_EUR = 15;
export const PREMIUM_INSURANCE_FEE_EUR = 15;
export const BASIC_INSURANCE_FEE_EUR = 0;

export function computeInsuranceFee(tier: "BASIC" | "PREMIUM"): number {
  return tier === "PREMIUM" ? PREMIUM_INSURANCE_FEE_EUR : BASIC_INSURANCE_FEE_EUR;
}

export function computeAgreedPrice(pricePerKg: number, weightKg: number, fallbackOfferedPrice: number): number {
  const computed = pricePerKg > 0 ? pricePerKg * weightKg : fallbackOfferedPrice;
  return Math.round(computed * 100) / 100;
}
