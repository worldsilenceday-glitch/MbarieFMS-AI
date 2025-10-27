import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding positions and users...");

  // Create positions (idempotent upsert-like behavior)
  const positions = [
    { title: "Managing Director", department: "Executive" },
    { title: "General Manager", department: "Executive" },
    { title: "Project Manager", department: "Executive" },
    { title: "Operations Manager", department: "Operations" },
    { title: "Workshop Manager", department: "Engineering" },
    { title: "Safety Coordinator", department: "HSSE" },
    { title: "Materials Coordinator", department: "Logistics" },
    { title: "Logistics Officer", department: "Logistics" },
    { title: "HR Manager", department: "HR" },
    { title: "HR Generalist", department: "HR" },
    { title: "Electrical Engineer", department: "Engineering" },
    { title: "Supervisor (Bonny)", department: "Operations" },
    { title: "QAQC Engineer", department: "DocumentQuality" }
  ];

  const createdPositions = [];
  for (const p of positions) {
    const pos = await prisma.position.upsert({
      where: { title: p.title },
      update: {},
      create: { title: p.title, department: p.department },
    });
    createdPositions.push(pos);
  }

  // Helper to find position id
  const findPosId = (title: string) => createdPositions.find(x => x.title === title)?.id || null;

  // Create users
  const users = [
    { name: "GoodLuck Mbarie", email: "goodluck.mbarie@mbarieservicesltd.com", positionTitle: "General Manager" },
    { name: "Allan", email: "allan@mbarieservicesltd.com", positionTitle: "Project Manager" },
    { name: "Thompson Aguheva", email: "aguheva.thompson@mbarieservicesltd.com", positionTitle: "Operations Manager" },
    { name: "Haroon Ahmed Amin", email: "haroon.amin@mbarieservicesltd.com", positionTitle: "Workshop Manager" },
    { name: "Bristol Harry", email: "bristol.harry@mbarieservicesltd.com", positionTitle: "Safety Coordinator" },
    { name: "Erasmus Hart Taribo", email: "erasmus-hart.taribo@mbarieservicesltd.com", positionTitle: "Materials Coordinator" },
    { name: "Mandy Brown", email: "mandy.brown@mbarieservicesltd.com", positionTitle: "Logistics Officer" },
    { name: "Clement", email: "clement.hr@mbarieservicesltd.com", positionTitle: "HR Manager" },
    { name: "Ufuoma Damilola-Ajewole", email: "ufuoma.damilolaajewole@mbarieservicesltd.com", positionTitle: "HR Generalist" },
    { name: "Ayo Oso Ebenezer", email: "ayo.ebenezer@mbarieservicesltd.com", positionTitle: "Supervisor (Bonny)" },
    { name: "Paul", email: "paul.qaqc@mbarieservicesltd.com", positionTitle: "QAQC Engineer" }
  ];

  for (const u of users) {
    const posId = findPosId(u.positionTitle);
    const nameParts = u.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const employeeId = u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        firstName: firstName,
        lastName: lastName,
        position: u.positionTitle,
        department: createdPositions.find(p => p.title === u.positionTitle)?.department || 'General',
        positionId: posId || undefined,
        employeeId: employeeId
      },
      create: {
        firstName: firstName,
        lastName: lastName,
        email: u.email,
        position: u.positionTitle,
        department: createdPositions.find(p => p.title === u.positionTitle)?.department || 'General',
        facility: 'Headquarters',
        employeeId: employeeId,
        positionId: posId || undefined,
        isActive: true
      },
    });
  }

  // Optional: create top-level organogram relationships (supervisor links)
  // Example: set General Manager's supervisor to Managing Director (if exists)
  const gm = await prisma.position.findUnique({ where: { title: "General Manager" } });
  const md = await prisma.position.upsert({
    where: { title: "Managing Director" },
    update: {},
    create: { title: "Managing Director", department: "Executive" },
  });

  if (gm && md) {
    await prisma.position.update({
      where: { id: gm.id },
      data: { supervisorId: md.id },
    });
  }

  // Set up some supervisor relationships
  const opsManager = await prisma.position.findUnique({ where: { title: "Operations Manager" } });
  const supervisorBonny = await prisma.position.findUnique({ where: { title: "Supervisor (Bonny)" } });
  
  if (opsManager && supervisorBonny) {
    await prisma.position.update({
      where: { id: supervisorBonny.id },
      data: { supervisorId: opsManager.id },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
