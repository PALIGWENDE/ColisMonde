import { describe, expect, it } from "vitest";
import { computeAgreedPrice, computeInsuranceFee, PREMIUM_INSURANCE_FEE_EUR } from "@/config/pricing";

describe("computeAgreedPrice", () => {
  it("multiplie le prix au kilo par le poids", () => {
    expect(computeAgreedPrice(8.5, 5, 30)).toBe(42.5);
  });

  it("arrondit au centime", () => {
    expect(computeAgreedPrice(3.333, 3, 0)).toBe(10);
    expect(computeAgreedPrice(1.005, 1, 0)).toBe(1);
    expect(computeAgreedPrice(2.345, 2, 0)).toBe(4.69);
  });

  it("utilise le prix proposé par l'expéditeur quand le trajet n'a pas de prix au kilo", () => {
    expect(computeAgreedPrice(0, 5, 30)).toBe(30);
  });
});

describe("computeInsuranceFee", () => {
  it("l'assurance de base est gratuite", () => {
    expect(computeInsuranceFee("BASIC")).toBe(0);
  });

  it("l'assurance premium est payante", () => {
    expect(computeInsuranceFee("PREMIUM")).toBe(PREMIUM_INSURANCE_FEE_EUR);
  });
});
