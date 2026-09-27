import { describe, expect, it } from "vitest";
import { wholeQuantity } from "./quantity";

describe("saisie des quantités entières", () => {
  it("conserve 201 sans changement d'échelle", () => {
    expect(wholeQuantity.parse("201")).toBe(201);
    expect(wholeQuantity.parse("0")).toBe(0);
  });

  it.each(["0.201", "0.2", "1.5", "0,201", "-1", "1000000000"])(
    "refuse la quantité %s sans l'arrondir ni la convertir",
    (value) => expect(wholeQuantity.safeParse(value).success).toBe(false),
  );
});
