import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const tradeServices: Record<string, string[]> = {
  Plumber: [
    "Pipe leak repair",
    "Toilet installation",
    "Drain unblocking",
    "Water heater repair",
    "Tap replacement",
    "Pump installation",
    "Bathroom fittings",
    "Emergency plumbing"
  ],
  Electrician: [
    "Wiring",
    "Fault tracing",
    "Socket installation",
    "Lighting setup",
    "Breaker replacement",
    "Generator changeover",
    "Meter board upgrade",
    "Appliance installation"
  ],
  Mason: ["Block work", "Plastering", "Concrete works", "Retaining walls", "Repairs", "Tiling prep", "Foundation works", "Screeding"],
  Carpenter: ["Furniture repair", "Cabinet making", "Door fixing", "Roof framing", "Shelving", "Wardrobe fitting", "Wood polishing", "Custom furniture"],
  Painter: ["Interior painting", "Exterior painting", "Surface prep", "Spray painting", "Texture finish", "Repainting", "Wood varnish", "Metal painting"],
  Tiler: ["Floor tiling", "Wall tiling", "Tile repair", "Grouting", "Tile replacement", "Outdoor tiling", "Bathroom tiling", "Kitchen backsplash"],
  Welder: ["Gate fabrication", "Window burglar proofing", "Stair rails", "Metal repairs", "Canopy frames", "Tank stands", "Door fabrication", "Welding reinforcement"],
  "AC Technician": ["AC installation", "Gas refill", "Servicing", "Compressor diagnosis", "Leak repair", "Duct cleaning", "Thermostat setup", "Emergency AC fix"],
  "General Handyman": ["Minor home repairs", "Hanging fixtures", "Drywall patch", "Basic carpentry", "Basic plumbing", "Basic electrical", "Furniture assembly", "General maintenance"]
};

const areas = [
  "East Legon",
  "Madina",
  "Adenta",
  "Tema",
  "Osu",
  "Labone",
  "Cantonments",
  "Achimota",
  "Dansoman",
  "Spintex",
  "Dzorwulu",
  "Abeka",
  "Kaneshie",
  "Kokomlemle",
  "Airport Residential"
];

async function main() {
  for (const tradeName of Object.keys(tradeServices)) {
    const trade = await prisma.tradeCategory.upsert({
      where: { name: tradeName },
      update: {},
      create: { name: tradeName }
    });

    for (const serviceName of tradeServices[tradeName]) {
      await prisma.serviceType.upsert({
        where: { tradeId_name: { tradeId: trade.id, name: serviceName } },
        update: {},
        create: { tradeId: trade.id, name: serviceName }
      });
    }
  }

  for (const area of areas) {
    await prisma.area.upsert({ where: { name: area }, update: {}, create: { name: area } });
  }

  const adminHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { phone: "+233000000001" },
    update: {},
    create: {
      name: "Platform Admin",
      phone: "+233000000001",
      email: "admin@accrahandyman.local",
      role: Role.ADMIN,
      passwordHash: adminHash,
      phoneVerified: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
