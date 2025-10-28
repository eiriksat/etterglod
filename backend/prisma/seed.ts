import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Memorial
  const memorial = await prisma.memorial.upsert({
    where: { slug: "kari-nordmann-1950-2025" },
    update: {},
    create: {
      slug: "kari-nordmann-1950-2025",
      name: "Kari Nordmann",
      birthDate: new Date("1950-04-12"),
      deathDate: new Date("2025-10-10"),
      bio: "Elsket og savnet.",
      imageUrl: null,
    },
  });

  // Ceremony
  await prisma.ceremony.upsert({
    where: { memorialId: memorial.id },
    update: {
      dateTime: new Date("2025-11-01T12:00:00Z"),
      venue: "Vår Frue kirke",
      address: "Trondheim",
      mapUrl: "https://maps.example",
      livestream: null,
    },
    create: {
      memorialId: memorial.id,
      dateTime: new Date("2025-11-01T12:00:00Z"),
      venue: "Vår Frue kirke",
      address: "Trondheim",
      mapUrl: "https://maps.example",
      livestream: null,
    },
  });

  // Attendance (RSVP)
  await prisma.attendance.create({
    data: {
      memorialId: memorial.id,
      name: "Eirik",
      email: "eiriksat@gmail.com",
      count: 2,
      notes: "uten nøtter",
    },
  });

  // Memory note (pendende)
  await prisma.memoryNote.create({
    data: {
      memorialId: memorial.id,
      author: "Ola",
      text: "Takk for alt.",
      approved: false,
    },
  });

  console.log("Seed completed.");
}

main().finally(() => prisma.$disconnect());
