#!/usr/bin/env tsx
/**
 * portal-sync.ts
 *
 * Pulls client configuration from the Rawgrowth portal and writes it into
 * the local knowledge/client/ and knowledge/competitors/ directories.
 *
 * Usage:
 *   npm run portal-sync               # uses PORTAL_TOKEN from .env
 *   npm run portal-sync -- --token TOKEN
 *   npm run portal-sync -- --portal-url https://custom.portal.url
 *
 * Run automatically: add to scheduled_tasks via schedule-cli
 *   node dist/schedule-cli.js create "npm run portal-sync" "0 3 * * *"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

// ── Config ───────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const args = process.argv.slice(2);
const tokenArg = args[args.indexOf('--token') + 1];
const portalArg = args[args.indexOf('--portal-url') + 1];

const PORTAL_TOKEN = tokenArg || process.env.PORTAL_TOKEN || '';
const PORTAL_URL = portalArg || process.env.PORTAL_URL || 'https://portal.rawgrowth.ai';

// ── Types ────────────────────────────────────────────────────────────────────

interface PortalClientConfig {
  companyName: string;
  website: string;
  description: string;
  icp: string;
  transformation: string;
  offer: {
    name: string;
    price: string;
    guarantee: string;
    phases?: Array<{ name: string; duration: string; description: string }>;
    objections?: Array<{ question: string; answer: string }>;
  };
  brandVoice: {
    tone: string;
    wordsToUse?: string[];
    wordsToAvoid?: string[];
    styleNotes?: string;
  };
  team: Array<{
    name: string;
    role: string;
    contact?: string;
    authority?: string;
  }>;
  competitors?: Array<{
    name: string;
    website?: string;
    notes?: string;
  }>;
  updatedAt: string;
}

// ── Fetch ────────────────────────────────────────────────────────────────────

async function fetchClientConfig(): Promise<PortalClientConfig> {
  if (!PORTAL_TOKEN) {
    throw new Error(
      'No PORTAL_TOKEN found. Set it in .env or pass --token TOKEN'
    );
  }

  const url = `${PORTAL_URL}/api/client-export`;
  console.log(`Fetching from ${url}...`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PORTAL_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Portal API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<PortalClientConfig>;
}

// ── Writers ──────────────────────────────────────────────────────────────────

function writeBusinessMd(config: PortalClientConfig, dir: string) {
  const today = new Date().toISOString().split('T')[0];
  const content = `---
generated: ${today}
source: portal
owner: ops
status: active
---

# Business Context

## What We Sell

**Company:** ${config.companyName}
**Website:** ${config.website}
**One-line description:** ${config.description}

## The Transformation

${config.transformation}

## Ideal Client Profile (ICP)

${config.icp}

## Offer Stack

**Main offer:** ${config.offer.name}
**Price:** ${config.offer.price}
**Guarantee:** ${config.offer.guarantee}
${
  config.offer.phases
    ? '\n## Process\n\n' +
      config.offer.phases
        .map((p) => `**${p.name}** (${p.duration})\n${p.description}`)
        .join('\n\n')
    : ''
}
${
  config.offer.objections
    ? '\n## Common Objections\n\n' +
      config.offer.objections
        .map((o) => `**"${o.question}"**\n${o.answer}`)
        .join('\n\n')
    : ''
}
`;
  fs.writeFileSync(path.join(dir, 'business.md'), content, 'utf-8');
  console.log('  ✓ knowledge/client/business.md');
}

function writeBrandVoiceMd(config: PortalClientConfig, dir: string) {
  const today = new Date().toISOString().split('T')[0];
  const { brandVoice } = config;
  const content = `---
generated: ${today}
source: portal
owner: ops
status: active
---

# Brand Voice

## Tone

${brandVoice.tone}

## Words We Use

${brandVoice.wordsToUse?.map((w) => `- ${w}`).join('\n') || '- (none specified)'}

## Words We Never Use

${brandVoice.wordsToAvoid?.map((w) => `- ${w}`).join('\n') || '- (none specified)'}
- Generic AI phrases: "game-changing", "revolutionary", "synergy"
- Filler openers: "I hope this finds you well", "I wanted to reach out"
- Em dashes (-- or —)

## Style Notes

${brandVoice.styleNotes || 'Short sentences. Active voice. Specific beats vague.'}
`;
  fs.writeFileSync(path.join(dir, 'brand-voice.md'), content, 'utf-8');
  console.log('  ✓ knowledge/client/brand-voice.md');
}

function writeTeamMd(config: PortalClientConfig, dir: string) {
  const today = new Date().toISOString().split('T')[0];
  const teamLines = config.team
    .map(
      (m) => `### ${m.name}\n**Role:** ${m.role}\n${m.contact ? `**Contact:** ${m.contact}\n` : ''}${m.authority ? `**Authority:** ${m.authority}\n` : ''}`
    )
    .join('\n');

  const content = `---
generated: ${today}
source: portal
owner: ops
status: active
---

# Team

${teamLines}
`;
  fs.writeFileSync(path.join(dir, 'team.md'), content, 'utf-8');
  console.log('  ✓ knowledge/client/team.md');
}

function writeCompetitorPlaceholders(
  config: PortalClientConfig,
  competitorDir: string
) {
  if (!config.competitors?.length) return;
  const today = new Date().toISOString().split('T')[0];

  for (const comp of config.competitors) {
    const slug = comp.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filePath = path.join(competitorDir, `${slug}.md`);

    // Don't overwrite existing profiles -- only create stubs
    if (fs.existsSync(filePath)) {
      console.log(`  ~ knowledge/competitors/${slug}.md (exists, skipped)`);
      continue;
    }

    const content = `# Competitor: ${comp.name}
${comp.website ? `Website: ${comp.website}` : ''}
Last updated: ${today}

${comp.notes ? comp.notes : ''}

> Run the competitor-intel skill to populate this file fully.
> Ask your research agent: "Analyze ${comp.name} using the competitor-intel skill"
`;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ knowledge/competitors/${slug}.md`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  Portal Sync\n');

  const clientDir = path.join(PROJECT_ROOT, 'knowledge', 'client');
  const competitorDir = path.join(PROJECT_ROOT, 'knowledge', 'competitors');
  fs.mkdirSync(clientDir, { recursive: true });
  fs.mkdirSync(competitorDir, { recursive: true });

  let config: PortalClientConfig;
  try {
    config = await fetchClientConfig();
  } catch (err) {
    console.error('\n  Error:', (err as Error).message);
    console.error('\n  Make sure PORTAL_TOKEN is set in .env');
    console.error('  Get your token from the portal dashboard under Settings → API\n');
    process.exit(1);
  }

  console.log(`\n  Client: ${config.companyName}`);
  console.log(`  Last updated in portal: ${config.updatedAt}`);
  console.log('\n  Writing knowledge files...\n');

  writeBusinessMd(config, clientDir);
  writeBrandVoiceMd(config, clientDir);
  writeTeamMd(config, clientDir);
  writeCompetitorPlaceholders(config, competitorDir);

  console.log('\n  Done. All agents will load this context on next message.\n');
  console.log('  To run again manually: npm run portal-sync');
  console.log(
    '  To schedule daily: node dist/schedule-cli.js create "npm run portal-sync" "0 3 * * *"\n'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
