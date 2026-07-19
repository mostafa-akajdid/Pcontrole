/**
 * Data Migration: Convert plain-text fullDescription to JSON format
 *
 * Old format: "Lorem ipsum..." (plain string)
 * New format: { type: "paragraph", content: "Lorem ipsum..." }
 *
 * Safe to run multiple times (idempotent).
 * Run AFTER: prisma db push (schema change)
 *
 * Usage: node prisma/migrations/migrate-description-json.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting fullDescription migration to JSON format...\n');

  const projects = await prisma.project.findMany({
    select: { id: true, title: true, fullDescription: true },
  });

  console.log(`Found ${projects.length} projects\n`);

  let migrated = 0;
  let skipped = 0;
  let alreadyMigrated = 0;

  for (const project of projects) {
    const desc = project.fullDescription;

    if (desc === null || desc === undefined) {
      skipped++;
      continue;
    }

    // Already a JSON object — skip
    if (typeof desc === 'object') {
      alreadyMigrated++;
      continue;
    }

    // Plain string — convert to paragraph format
    if (typeof desc === 'string') {
      const trimmed = desc.trim();
      if (!trimmed) {
        // Empty string → set to null
        await prisma.project.update({
          where: { id: project.id },
          data: { fullDescription: null },
        });
        skipped++;
        continue;
      }

      const jsonDescription = JSON.stringify({
        type: 'paragraph',
        content: trimmed,
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { fullDescription: jsonDescription },
      });

      migrated++;
      console.log(`  ✓ Migrated: "${project.title}" (${trimmed.length} chars)`);
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Already JSON: ${alreadyMigrated}`);
  console.log(`  Skipped (null/empty): ${skipped}`);
  console.log(`  Total: ${projects.length}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
