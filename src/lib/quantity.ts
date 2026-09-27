import { z } from "zod";

export const wholeQuantity = z.coerce.number()
  .int("Saisissez une quantité entière, par exemple 201, sans virgule ni point.")
  .min(0, "La quantité ne peut pas être négative.")
  .max(999999999);
