import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

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
}

main()
  .then(() => console.info("Rozi a été initialisé avec succès."))
  .finally(async () => prisma.$disconnect());
