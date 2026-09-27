import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { MovementReason, MovementType, PrismaClient, UserRole } from "../src/generated/prisma/client";

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} est obligatoire.`);
  return value;
}

const databaseUrl = requiredEnvironmentVariable("DATABASE_URL");
const adminUsername = requiredEnvironmentVariable("INITIAL_ADMIN_USERNAME").toLowerCase();
const adminPassword = requiredEnvironmentVariable("INITIAL_ADMIN_PASSWORD");

if (adminPassword === "replace-me-before-seeding" || adminPassword.length < 12) {
  throw new Error("INITIAL_ADMIN_PASSWORD doit être un vrai mot de passe d'au moins 12 caractères.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const categories = [
  "Ciment",
  "Peinture",
  "Électricité",
  "Plomberie",
  "Visserie",
  "Outillage",
  "Bois",
  "Serrurerie",
  "Matériaux",
  "Autres",
];

const units = [
  { name: "pièce", symbol: "pce", decimals: 0 },
  { name: "carton", symbol: "ctn", decimals: 0 },
  { name: "sac", symbol: "sac", decimals: 0 },
  { name: "boîte", symbol: "bte", decimals: 0 },
  { name: "mètre", symbol: "m", decimals: 3 },
  { name: "kilogramme", symbol: "kg", decimals: 3 },
  { name: "litre", symbol: "L", decimals: 3 },
  { name: "rouleau", symbol: "rlx", decimals: 0 },
  { name: "paquet", symbol: "pqt", decimals: 0 },
];

async function main() {
  const passwordHash = await hash(adminPassword, 12);

  await prisma.$transaction([
    ...categories.map((name) =>
      prisma.category.upsert({ where: { name }, update: { isActive: true }, create: { name } }),
    ),
    ...units.map((unit) =>
      prisma.unit.upsert({ where: { name: unit.name }, update: unit, create: unit }),
    ),
    prisma.user.upsert({
      where: { username: adminUsername },
      update: { isActive: true, role: UserRole.ADMIN },
      create: {
        username: adminUsername,
        name: "Administrateur",
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
  ]);

  if (process.env.SEED_DEMO_DATA === "true") await seedDemoData();
}

async function seedDemoData() {
  const admin = await prisma.user.findUniqueOrThrow({ where: { username: adminUsername } });
  const [visserie, ciment, electricite, piece, sac, metre] = await Promise.all([
    prisma.category.findUniqueOrThrow({ where: { name: "Visserie" } }),
    prisma.category.findUniqueOrThrow({ where: { name: "Ciment" } }),
    prisma.category.findUniqueOrThrow({ where: { name: "Électricité" } }),
    prisma.unit.findUniqueOrThrow({ where: { name: "pièce" } }),
    prisma.unit.findUniqueOrThrow({ where: { name: "sac" } }),
    prisma.unit.findUniqueOrThrow({ where: { name: "mètre" } }),
  ]);
  const existingSupplier = await prisma.supplier.findUnique({ where: { code: "DEMO-BATI" } });
  if (existingSupplier && existingSupplier.email !== "demo@example.invalid") {
    throw new Error("Le code fournisseur DEMO-BATI existe déjà et n’appartient pas au jeu de démonstration.");
  }
  const supplier = await prisma.supplier.upsert({
    where: { code: "DEMO-BATI" },
    update: { isActive: true },
    create: { code: "DEMO-BATI", name: "Fournitures Bâtiment Démo", contactName: "Contact fictif", email: "demo@example.invalid", paymentTermsDays: 30, leadTimeDays: 5 },
  });
  const fixtures = [
    { sku: "DEMO-VIS-4X40", name: "Vis bois 4 × 40 mm", categoryId: visserie.id, unitId: piece.id, initial: 500, sold: 135, threshold: 150, purchase: 8, sale: 18 },
    { sku: "DEMO-CIMENT-25", name: "Ciment 25 kg", categoryId: ciment.id, unitId: sac.id, initial: 60, sold: 26, threshold: 15, purchase: 690, sale: 990 },
    { sku: "DEMO-CABLE-25", name: "Câble électrique 2,5 mm²", categoryId: electricite.id, unitId: metre.id, initial: 250, sold: 70, threshold: 60, purchase: 75, sale: 140 },
  ];
  for (const fixture of fixtures) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { sku: fixture.sku }, include: { inventory: true } });
      if (existing) {
        const foreignMovement = await tx.stockMovement.findFirst({ where: { productId: existing.id, OR: [{ reference: null }, { NOT: { reference: { startsWith: "DEMO-" } } }] }, select: { id: true } });
        const demoMovementCount = await tx.stockMovement.count({ where: { productId: existing.id, reference: { startsWith: "DEMO-" } } });
        if (!existing.inventory || foreignMovement || demoMovementCount !== 2 || existing.name !== fixture.name) {
          throw new Error(`La référence ${fixture.sku} existe déjà et n’appartient pas au jeu de démonstration.`);
        }
        return;
      }
      const finalStock = fixture.initial - fixture.sold;
      const product = await tx.product.create({
        data: { sku: fixture.sku, name: fixture.name, categoryId: fixture.categoryId, unitId: fixture.unitId, supplierId: supplier.id, alertThreshold: fixture.threshold, purchasePriceMinor: fixture.purchase, salePriceMinor: fixture.sale, createdById: admin.id, inventory: { create: { quantity: finalStock } } },
      });
      const receivedAt = new Date(); receivedAt.setDate(receivedAt.getDate() - 24);
      const soldAt = new Date(); soldAt.setDate(soldAt.getDate() - 8);
      await tx.stockMovement.createMany({ data: [
        { productId: product.id, userId: admin.id, supplierId: supplier.id, type: MovementType.IN, reason: MovementReason.INITIAL_STOCK, quantity: fixture.initial, delta: fixture.initial, stockBefore: 0, stockAfter: fixture.initial, occurredAt: receivedAt, reference: "DEMO-INITIAL", comment: "Donnée fictive de démonstration" },
        { productId: product.id, userId: admin.id, type: MovementType.OUT, reason: MovementReason.SALE, quantity: fixture.sold, delta: -fixture.sold, stockBefore: fixture.initial, stockAfter: finalStock, occurredAt: soldAt, reference: "DEMO-VENTE", comment: "Donnée fictive de démonstration" },
      ] });
    });
  }
}

main()
  .then(() => console.info("Rozi a été initialisé avec succès."))
  .finally(async () => prisma.$disconnect());
