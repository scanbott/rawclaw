#!/usr/bin/env tsx
import crypto from 'crypto';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ── ANSI helpers ────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
};

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') return path.join(os.homedir(), p.slice(1));
  return p;
}

// ── Banner ───────────────────────────────────────────────────────────────────
function loadBanner(): string {
  try {
    return fs.readFileSync(path.join(PROJECT_ROOT, 'banner.txt'), 'utf-8');
  } catch {
    return '\n  RawClaw\n';
  }
}

// ── Shared readline ──────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

async function ask(question: string, defaultVal?: string): Promise<string> {
  return new Promise((resolve) => {
    const hint = defaultVal ? ` ${c.gray}(${defaultVal})${c.reset}` : '';
    rl.question(`  ${c.bold}${question}${c.reset}${hint} › `, (ans) => {
      resolve(ans.trim() || defaultVal || '');
    });
  });
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const ans = await ask(`${question} [${hint}]`);
  if (!ans) return defaultYes;
  return ans.toLowerCase().startsWith('y');
}

function section(title: string) {
  console.log();
  console.log(`  ${c.bold}${c.white}${title}${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(title.length + 2)}${c.reset}`);
  console.log();
}

function info(msg: string) {
  console.log(`  ${c.gray}${msg}${c.reset}`);
}

function ok(msg: string) {
  console.log(`  ${c.green}✓${c.reset}  ${msg}`);
}

function warn(msg: string) {
  console.log(`  ${c.yellow}⚠${c.reset}  ${msg}`);
}

function fail(msg: string) {
  console.log(`  ${c.red}✗${c.reset}  ${msg}`);
}

function bullet(msg: string) {
  console.log(`  ${c.cyan}•${c.reset}  ${msg}`);
}

function spinner(label: string): { stop: (status: 'ok' | 'fail' | 'warn', msg?: string) => void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const iv = setInterval(() => {
    process.stdout.write(`\r  ${c.cyan}${frames[i++ % frames.length]}${c.reset}  ${label}   `);
  }, 80);
  return {
    stop(status, msg) {
      clearInterval(iv);
      const icon = status === 'ok' ? `${c.green}✓${c.reset}` : status === 'warn' ? `${c.yellow}⚠${c.reset}` : `${c.red}✗${c.reset}`;
      process.stdout.write(`\r  ${icon}  ${msg ?? label}\n`);
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  let content: string;
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { return result; }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) result[key] = value;
  }
  return result;
}

async function validateBotToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = (await res.json()) as { ok: boolean; result?: { username?: string } };
    if (data.ok && data.result) return { valid: true, username: data.result.username };
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

const PLATFORM = process.platform;

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {

  // ── 1. Banner + intro ────────────────────────────────────────────────────
  console.log(`${c.cyan}${c.bold}${loadBanner()}${c.reset}`);
  console.log(`  ${c.bold}Welcome to RawClaw.${c.reset}`);
  console.log();
  info('This wizard will get you set up in about 5 minutes.');
  info('Press Ctrl+C at any time to exit. You can re-run this at any time with: npm run setup');
  console.log();

  // ── 2. System checks ─────────────────────────────────────────────────────
  section('System checks');

  // Node
  const nodeMajor = parseInt(process.version.slice(1).split('.')[0], 10);
  if (nodeMajor >= 20) {
    ok(`Node.js ${process.version}`);
  } else {
    fail(`Node.js ${process.version} — version 20+ required`);
    info('Download: https://nodejs.org');
    process.exit(1);
  }

  // Claude CLI
  const claudeCmd = PLATFORM === 'win32' ? 'where claude' : 'which claude';
  try {
    execSync(claudeCmd, { stdio: 'pipe' });
    let version = '';
    try { version = execSync('claude --version', { stdio: 'pipe' }).toString().trim(); } catch { }
    ok(`Claude CLI ${version}`);
  } catch {
    fail('Claude CLI not found');
    console.log();
    info('Install it:');
    info('  npm install -g @anthropic-ai/claude-code');
    info('  claude login');
    console.log();
    const proceed = await confirm('Install Claude Code now and re-run setup later?', false);
    if (proceed) {
      console.log();
      info('Running: npm install -g @anthropic-ai/claude-code');
      const result = spawnSync('npm', ['install', '-g', '@anthropic-ai/claude-code'], { stdio: 'inherit' });
      if (result.status === 0) {
        ok('Claude Code installed. Run claude login, then npm run setup again.');
      } else {
        fail('Install failed. Run manually: npm install -g @anthropic-ai/claude-code');
      }
    }
    process.exit(1);
  }

  // Claude auth — check if logged in, offer to log in if not
  let claudeAuthed = false;
  try {
    const authCheck = execSync('claude auth status', { stdio: 'pipe', timeout: 10000 }).toString();
    if (authCheck.toLowerCase().includes('logged in') || authCheck.toLowerCase().includes('authenticated')) {
      claudeAuthed = true;
    }
  } catch { /* auth status command may not exist in older versions */ }

  if (!claudeAuthed) {
    // Fallback: check if ~/.claude/ has auth files
    try {
      const claudeDir = path.join(os.homedir(), '.claude');
      const hasAuth = fs.existsSync(claudeDir) && fs.readdirSync(claudeDir).some(f => f.includes('auth') || f.includes('credentials') || f.includes('oauth'));
      if (hasAuth) claudeAuthed = true;
    } catch { }
  }

  if (claudeAuthed) {
    ok('Claude auth — logged in');
  } else {
    warn('Claude not logged in yet');
    info('Running claude login now (follow the browser prompt)...');
    console.log();
    const loginResult = spawnSync('claude', ['login'], { stdio: 'inherit', timeout: 120000 });
    if (loginResult.status === 0) {
      ok('Claude login complete');
    } else {
      warn('Claude login skipped. Run "claude login" manually before starting the bot.');
    }
  }

  // Git config (user.name and user.email)
  let gitName = '';
  let gitEmail = '';
  try { gitName = execSync('git config user.name', { stdio: 'pipe' }).toString().trim(); } catch { }
  try { gitEmail = execSync('git config user.email', { stdio: 'pipe' }).toString().trim(); } catch { }
  if (gitName && gitEmail) {
    ok(`Git identity: ${gitName} <${gitEmail}>`);
  } else {
    warn('Git identity not configured — this will cause errors later');
    console.log();
    info('Run these two commands (use your own name and email):');
    console.log(`  ${c.cyan}git config --global user.name "Your Name"${c.reset}`);
    console.log(`  ${c.cyan}git config --global user.email "you@email.com"${c.reset}`);
    console.log();
    const fixNow = await confirm('Set them now?', true);
    if (fixNow) {
      const name = await ask('Your name');
      const email = await ask('Your email');
      if (name) { try { execSync(`git config --global user.name "${name}"`, { stdio: 'pipe' }); } catch { } }
      if (email) { try { execSync(`git config --global user.email "${email}"`, { stdio: 'pipe' }); } catch { } }
      if (name && email) ok(`Git identity set: ${name} <${email}>`);
    }
  }

  // Dependencies check
  const nodeModulesExists = fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'));
  if (nodeModulesExists) {
    ok('Dependencies installed (node_modules/)');
  } else {
    warn('Dependencies not installed — running npm install...');
    const install = spawnSync('npm', ['install'], { cwd: PROJECT_ROOT, stdio: 'inherit' });
    if (install.status === 0) {
      ok('Dependencies installed');
    } else {
      fail('npm install failed. Check your Node.js installation and try again.');
      process.exit(1);
    }
  }

  // Build check
  const distExists = fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'index.js'));
  if (distExists) {
    ok('Build output found (dist/)');
  } else {
    warn('Not built yet — building now...');
    const build = spawnSync('npm', ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'inherit' });
    if (build.status === 0) {
      ok('Build complete');
    } else {
      fail('Build failed. Fix TypeScript errors, then re-run setup.');
      process.exit(1);
    }
  }

  // ── 4. What do you want to enable? ──────────────────────────────────────
  section('Choose your features');

  info('RawClaw has several optional features. Tell us what you want.');
  info('You can always add more later by editing .env and restarting.');
  console.log();

  const wantVoiceIn = await confirm('Voice input? (send voice notes → transcribed by Groq Whisper, free)', true);
  const wantVoiceOut = wantVoiceIn
    ? await confirm('Voice output? (Claude responds with audio via ElevenLabs — requires voice cloning)', false)
    : false;
  const wantVideo = await confirm('Video analysis? (send video clips → analyzed by Google Gemini)', false);
  const wantWhatsApp = await confirm('WhatsApp bridge? (view and reply to WhatsApp from Telegram)', false);
  const wantSlack = await confirm('Slack integration? (read and post to Slack channels from Telegram)', false);

  // WhatsApp explanation if they said yes
  if (wantWhatsApp) {
    console.log();
    console.log(`  ${c.bold}How the WhatsApp bridge works:${c.reset}`);
    console.log();
    info('RawClaw uses whatsapp-web.js to connect to your existing WhatsApp');
    info('account via the Linked Devices feature (same as WhatsApp Web).');
    console.log();
    info('A separate process (wa-daemon) runs in the background:');
    bullet('Keeps a Puppeteer browser session alive');
    bullet('Stores incoming messages to SQLite');
    bullet('Exposes an HTTP API on port 4242');
    console.log();
    info('First run: a QR code prints to your terminal. Scan it from');
    info('WhatsApp → Settings → Linked Devices. Session saves after that.');
    console.log();
    info('No API key needed — it uses your existing WhatsApp account.');
    console.log();

    console.log(`  ${c.bold}Message security:${c.reset}`);
    console.log();
    bullet('All message bodies are encrypted at rest (AES-256-GCM)');
    bullet('Messages auto-delete after 3 days');
    bullet('The database and session files are gitignored and never committed');
    bullet('Encryption key is stored in your .env (auto-generated if not set)');
    console.log();

    warn('Note: WhatsApp may occasionally disconnect and require a re-scan.');
    console.log();
  }

  // ── 5. Config directory (RAWCLAW_CONFIG) ──────────────────────────────
  section('Config directory (RAWCLAW_CONFIG)');

  info('Personal config files (CLAUDE.md, agent configs) live outside the repo');
  info('so they are never accidentally committed. Defaults to ~/.rawclaw');
  console.log();

  const envForConfig = parseEnvFile(path.join(PROJECT_ROOT, '.env'));
  const defaultConfigDir = expandHome(
    envForConfig.RAWCLAW_CONFIG || '~/.rawclaw',
  );
  info(`Current path: ${defaultConfigDir}`);
  console.log();

  let rawclawConfigDir = defaultConfigDir;
  const changeConfigDir = await confirm('Change this path?', false);
  if (changeConfigDir) {
    const input = await ask('Config directory', '~/.rawclaw');
    rawclawConfigDir = expandHome(input.trim() || '~/.rawclaw');
  }

  // If the chosen directory already exists, notify and let user decide
  if (fs.existsSync(rawclawConfigDir)) {
    const hasClaudeMd = fs.existsSync(path.join(rawclawConfigDir, 'CLAUDE.md'));
    ok(`Directory already exists${hasClaudeMd ? ' — CLAUDE.md found' : ' — no CLAUDE.md yet'}`);
    const useExisting = await confirm('Use this directory as-is?', true);
    if (!useExisting) {
      const newPath = await ask('Enter a different path');
      if (newPath.trim()) rawclawConfigDir = expandHome(newPath.trim());
    }
  }

  // Create the directory if needed
  if (!fs.existsSync(rawclawConfigDir)) {
    fs.mkdirSync(rawclawConfigDir, { recursive: true });
    ok(`Created ${rawclawConfigDir}`);
  }

  // Ensure CLAUDE.md exists in the config dir (copy from example if needed)
  const claudeMdDest = path.join(rawclawConfigDir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdDest)) {
    const exampleSrc = path.join(PROJECT_ROOT, 'CLAUDE.md.example');
    if (fs.existsSync(exampleSrc)) {
      fs.copyFileSync(exampleSrc, claudeMdDest);
      ok(`Created CLAUDE.md from template → ${claudeMdDest}`);
    } else {
      warn(`No CLAUDE.md.example found — create ${claudeMdDest} manually`);
    }
  } else {
    ok(`CLAUDE.md exists at ${claudeMdDest}`);
  }

  // ── 5b. CLAUDE.md personalization ────────────────────────────────────────
  section('Personalize your assistant');

  info('A few quick questions to set up your assistant\'s personality.');
  info('These get written into CLAUDE.md, the file loaded into every session.');
  console.log();

  const assistantName = await ask('What should your assistant be called?', 'Jarvis');
  const ownerName = await ask('What\'s your name?');
  const ownerRole = await ask('What do you do? (e.g. "I run a marketing agency")', '');
  const obsidianPath = await ask('Obsidian vault path (leave blank to skip)', '');

  // Replace placeholders in CLAUDE.md
  if (fs.existsSync(claudeMdDest)) {
    let claudeContent = fs.readFileSync(claudeMdDest, 'utf-8');
    if (assistantName) {
      claudeContent = claudeContent.replace(/\[YOUR ASSISTANT NAME\]/g, assistantName);
    }
    if (ownerName) {
      claudeContent = claudeContent.replace(/\[YOUR NAME\]/g, ownerName);
      claudeContent = claudeContent.replace(/\[YOUR_NAME\]/g, ownerName);
    }
    if (obsidianPath) {
      claudeContent = claudeContent.replace(/\[YOUR_OBSIDIAN_VAULT_PATH\]/g, expandHome(obsidianPath));
      claudeContent = claudeContent.replace(/\[YOUR_OBSIDIAN_VAULT\]/g, expandHome(obsidianPath));
    }
    if (ownerRole) {
      claudeContent = claudeContent.replace(
        /\[YOUR NAME\] \[does what you do\]\. \[Brief description[^\]]*\]/g,
        `${ownerName || assistantName} ${ownerRole}`
      );
    }
    fs.writeFileSync(claudeMdDest, claudeContent, 'utf-8');
    ok(`CLAUDE.md personalized — assistant: ${assistantName}, owner: ${ownerName || '(not set)'}`);
  }

  console.log();
  const openClaude = await confirm('Open CLAUDE.md to review or add more context?', false);
  if (openClaude) {
    const editor = process.env.EDITOR || (PLATFORM === 'win32' ? 'notepad' : 'nano');
    try {
      spawnSync(editor, [claudeMdDest], { stdio: 'inherit' });
    } catch {
      warn(`Could not open ${editor}. Edit manually: ${claudeMdDest}`);
    }
  }

  // ── 7. Skills to install ─────────────────────────────────────────────────
  section('Skills you might want');

  info('RawClaw auto-loads every skill in ~/.claude/skills/.');
  info('Here are the most useful ones to install:');
  console.log();

  console.log(`  ${c.bold}Core skills (for everyone):${c.reset}`);
  bullet('gmail           — read, triage, reply to email');
  bullet('google-calendar — schedule meetings, check availability');
  bullet('todo            — read tasks from Obsidian or text files');
  bullet('agent-browser   — browse the web, fill forms, scrape data');
  bullet('maestro         — run tasks in parallel with sub-agents');
  console.log();

  if (wantVideo) {
    console.log(`  ${c.bold}Gemini skill (required for video analysis):${c.reset}`);
    console.log();
    info('RawClaw\'s video analysis uses the gemini-api-dev skill from Google.');
    info('It handles text, images, audio, video, function calling, and structured output.');
    info('Install it from: https://github.com/google-gemini/gemini-skills');
    console.log();
    bullet('Skill docs:  github.com/google-gemini/gemini-skills/blob/main/skills/gemini-api-dev/SKILL.md');
    bullet('Requires:    GOOGLE_API_KEY in .env (get free at aistudio.google.com)');
    bullet('Install:     Copy the skill folder into ~/.claude/skills/gemini-api-dev/');
    console.log();
  }

  info('Full skills catalog: https://github.com/anthropics/claude-code/tree/main/skills');
  console.log();

  // ── 8. API keys ───────────────────────────────────────────────────────────
  section('Telegram');

  const envPath = path.join(PROJECT_ROOT, '.env');
  const env: Record<string, string> = fs.existsSync(envPath) ? parseEnvFile(envPath) : {};

  // Persist RAWCLAW_CONFIG determined in section 6
  env.RAWCLAW_CONFIG = rawclawConfigDir;

  let botUsername = '';
  if (env.TELEGRAM_BOT_TOKEN) {
    const s = spinner('Validating existing bot token...');
    const r = await validateBotToken(env.TELEGRAM_BOT_TOKEN);
    if (r.valid) {
      botUsername = r.username || '';
      s.stop('ok', `Bot: @${botUsername}`);
    } else {
      s.stop('fail', 'Existing token invalid — enter a new one');
      delete env.TELEGRAM_BOT_TOKEN;
    }
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log();
    info('You need a Telegram bot token. Get one from @BotFather:');
    bullet('Open Telegram → search @BotFather');
    bullet('Send /newbot');
    bullet('Follow the prompts, copy the token it gives you');
    console.log();

    let valid = false;
    while (!valid) {
      const token = await ask('Paste your bot token');
      if (!token) { console.log(`  ${c.red}Required.${c.reset}`); continue; }
      const s = spinner('Validating...');
      const r = await validateBotToken(token);
      if (r.valid) {
        env.TELEGRAM_BOT_TOKEN = token;
        botUsername = r.username || '';
        s.stop('ok', `Bot: @${botUsername}`);
        valid = true;
      } else {
        s.stop('fail', 'Invalid token. Try again.');
      }
    }
  }

  console.log();
  if (env.ALLOWED_CHAT_ID) {
    ok(`Chat ID: ${env.ALLOWED_CHAT_ID}`);
  } else {
    info('Your chat ID locks the bot so only YOU can talk to it.');
    info('To get it, you need to have a quick conversation with your bot:');
    console.log();
    bullet('Open Telegram on your phone or desktop');
    bullet(`Search for your bot: @${botUsername || 'your_bot_username'}`);
    bullet('Tap Start or send any message to it');
    bullet('The bot will reply with your chat ID (a number like 123456789)');
    bullet('Copy that number and paste it below');
    console.log();
    info('Don\'t have it yet? Press Enter to skip. The bot will show your');
    info('chat ID the first time you message it. Add it to .env and restart.');
    console.log();
    const chatId = await ask('Your Telegram chat ID (or Enter to skip)', 'skip');
    if (chatId !== 'skip' && chatId) env.ALLOWED_CHAT_ID = chatId;
  }

  // ── 8b. Slack (optional) ────────────────────────────────────────────────
  if (wantSlack) {
    section('Slack integration');

    console.log(`  ${c.bold}How the Slack integration works:${c.reset}`);
    console.log();
    info('RawClaw uses a Slack User Token to read and post messages');
    info('on your behalf. This lets you interact with Slack channels');
    info('directly from Telegram.');
    console.log();
    info('To get your Slack User Token:');
    bullet('Go to https://api.slack.com/apps');
    bullet('Create a new app (or select an existing one)');
    bullet('Go to OAuth & Permissions');
    bullet('Add the scopes you need (e.g. channels:read, chat:write, users:read)');
    bullet('Install the app to your workspace');
    bullet('Copy the User OAuth Token (starts with xoxp-)');
    console.log();

    if (env.SLACK_USER_TOKEN) {
      ok('Slack User Token already configured');
    } else {
      const token = await ask('Slack User Token (xoxp-...) — Enter to skip');
      if (token) {
        env.SLACK_USER_TOKEN = token;
        ok('Slack User Token saved');
      } else {
        info('Skipped. Add SLACK_USER_TOKEN to .env later.');
      }
    }
  }

  // ── 9. Security ──────────────────────────────────────────────────────────
  section('Secure your bot');

  info('RawClaw has full access to your machine. If someone gets into');
  info('your Telegram account, they control the bot. These layers protect you.');
  console.log();

  // Dashboard token (always generate)
  if (!env.DASHBOARD_TOKEN) {
    env.DASHBOARD_TOKEN = crypto.randomBytes(24).toString('hex');
  }
  ok('Dashboard token set');

  // Security is opt-in — skip PIN and kill phrase by default for clean first-run experience.
  // Users can add SECURITY_PIN_HASH and EMERGENCY_KILL_PHRASE to .env later.
  if (env.SECURITY_PIN_HASH) {
    ok('PIN lock already configured');
  }
  if (env.EMERGENCY_KILL_PHRASE) {
    ok('Emergency kill phrase already configured');
  } else {
    // Auto-generate a kill phrase silently so the feature works if needed
    env.EMERGENCY_KILL_PHRASE = 'EMERGENCY_STOP_' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  // ── 10. Voice keys ────────────────────────────────────────────────────────
  if (wantVoiceIn || wantVoiceOut) {
    section('Voice configuration');
  }

  if (wantVoiceIn) {
    if (env.GROQ_API_KEY) {
      ok('Groq STT already configured');
    } else {
      info('Groq provides free voice transcription (Whisper large-v3).');
      info('Sign up free at: console.groq.com → API Keys');
      console.log();
      const key = await ask('Groq API key (Enter to skip)');
      if (key) env.GROQ_API_KEY = key;
    }
  }

  if (wantVoiceOut) {
    if (env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID) {
      ok('ElevenLabs TTS already configured');
    } else {
      console.log();
      info('ElevenLabs generates spoken responses in your cloned voice.');
      info('Sign up at elevenlabs.io → clone your voice under Voice Lab.');
      console.log();
      if (!env.ELEVENLABS_API_KEY) {
        const key = await ask('ElevenLabs API key (Enter to skip)');
        if (key) env.ELEVENLABS_API_KEY = key;
      }
      if (env.ELEVENLABS_API_KEY && !env.ELEVENLABS_VOICE_ID) {
        info('Voice ID is the string ID in ElevenLabs, not the voice name.');
        const vid = await ask('ElevenLabs Voice ID (Enter to skip)');
        if (vid) env.ELEVENLABS_VOICE_ID = vid;
      }
    }
  }

  // ── 10. Video / Gemini ────────────────────────────────────────────────────
  if (wantVideo) {
    section('Video analysis — Google Gemini');

    if (env.GOOGLE_API_KEY) {
      ok('Google API key already configured');
    } else {
      info('Get a free Google API key at: aistudio.google.com → Get API key');
      info('Then install the gemini-api-dev skill from:');
      info('github.com/google-gemini/gemini-skills');
      console.log();
      const key = await ask('Google API key (Enter to skip)');
      if (key) env.GOOGLE_API_KEY = key;
    }
  }

  // Claude auth — uses `claude login` OAuth by default, no key needed.
  // ANTHROPIC_API_KEY is preserved if already set but not prompted for.

  // ── Write .env ────────────────────────────────────────────────────────
  console.log();
  const sw = spinner('Saving .env...');
  await sleep(300);

  const lines = [
    '# RawClaw — generated by setup wizard',
    '# Edit freely. Re-run: npm run setup',
    '',
    '# ── Required ──────────────────────────────────────────────────',
    `TELEGRAM_BOT_TOKEN=${env.TELEGRAM_BOT_TOKEN || ''}`,
    `ALLOWED_CHAT_ID=${env.ALLOWED_CHAT_ID || ''}`,
    '',
    '# ── Config directory (personal config, never committed) ───────',
    `RAWCLAW_CONFIG=${env.RAWCLAW_CONFIG || ''}`,
    '',
    '# ── Claude auth (optional — uses claude login by default) ─────',
    `ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY || ''}`,
    '',
    '# ── Voice ─────────────────────────────────────────────────────',
    `GROQ_API_KEY=${env.GROQ_API_KEY || ''}`,
    `ELEVENLABS_API_KEY=${env.ELEVENLABS_API_KEY || ''}`,
    `ELEVENLABS_VOICE_ID=${env.ELEVENLABS_VOICE_ID || ''}`,
    '',
    '# ── Integrations ──────────────────────────────────────────────',
    `GOOGLE_API_KEY=${env.GOOGLE_API_KEY || ''}`,
    `SLACK_USER_TOKEN=${env.SLACK_USER_TOKEN || ''}`,
    '',
    '# ── Dashboard ─────────────────────────────────────────────────',
    `DASHBOARD_TOKEN=${env.DASHBOARD_TOKEN || ''}`,
    `DASHBOARD_PORT=${env.DASHBOARD_PORT || '3141'}`,
    env.DASHBOARD_URL ? `DASHBOARD_URL=${env.DASHBOARD_URL}` : '# DASHBOARD_URL=',
    '',
    '# ── Security ──────────────────────────────────────────────────',
    env.SECURITY_PIN_HASH ? `SECURITY_PIN_HASH=${env.SECURITY_PIN_HASH}` : '# SECURITY_PIN_HASH=',
    env.IDLE_LOCK_MINUTES ? `IDLE_LOCK_MINUTES=${env.IDLE_LOCK_MINUTES}` : '# IDLE_LOCK_MINUTES=30',
    env.EMERGENCY_KILL_PHRASE ? `EMERGENCY_KILL_PHRASE=${env.EMERGENCY_KILL_PHRASE}` : '# EMERGENCY_KILL_PHRASE=',
    '',
    '# ── Database Encryption ───────────────────────────────────────',
    '# Auto-generated. DO NOT share or commit.',
    `DB_ENCRYPTION_KEY=${env.DB_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')}`,
  ];

  // Preserve unknown keys
  const known = new Set(['TELEGRAM_BOT_TOKEN','ALLOWED_CHAT_ID','RAWCLAW_CONFIG','ANTHROPIC_API_KEY','GROQ_API_KEY','ELEVENLABS_API_KEY','ELEVENLABS_VOICE_ID','GOOGLE_API_KEY','SLACK_USER_TOKEN','CLAUDE_CODE_OAUTH_TOKEN','WHATSAPP_ENABLED','DB_ENCRYPTION_KEY','DASHBOARD_TOKEN','DASHBOARD_PORT','DASHBOARD_URL','SECURITY_PIN_HASH','IDLE_LOCK_MINUTES','EMERGENCY_KILL_PHRASE','DESTRUCTIVE_CONFIRM']);
  for (const [k, v] of Object.entries(env)) {
    if (!known.has(k) && v) lines.push(`${k}=${v}`);
  }

  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');

  const written = parseEnvFile(envPath);
  const keyCount = Object.values(written).filter(Boolean).length;
  sw.stop('ok', `.env saved (${keyCount} key${keyCount !== 1 ? 's' : ''} configured)`);

  // Cloudflare tunnel starts automatically when the bot runs (prestart hook).
  // No need to start it during setup since the dashboard server isn't running yet.

  // ── 13. Auto-start service ───────────────────────────────────────────────
  if (PLATFORM === 'darwin') {
    await setupMacOS();
  } else if (PLATFORM === 'linux') {
    await setupLinux();
  } else if (PLATFORM === 'win32') {
    setupWindows();
  } else {
    section('Auto-start');
    info('Unknown platform. Start manually: npm start');
    info('Or use PM2: pm2 start dist/index.js --name rawclaw && pm2 save');
  }

  // ── macOS permissions warning ──────────────────────────────────────────
  if (PLATFORM === 'darwin') {
    console.log();
    warn('macOS may show "Node wants to access..." permission dialogs on first run.');
    info('Keep an eye on your Mac screen and click Allow when prompted.');
    info('If the bot hangs with no response, check for pending permission dialogs.');
  }

  // ── 14. WhatsApp daemon reminder ─────────────────────────────────────────
  if (wantWhatsApp) {
    section('WhatsApp — next steps');
    info('To start the WhatsApp daemon:');
    console.log();
    console.log(`  ${c.cyan}npx tsx scripts/wa-daemon.ts${c.reset}`);
    console.log();
    info('A QR code will appear. Scan it from:');
    info('  WhatsApp → Settings → Linked Devices → Link a Device');
    console.log();
    info('The session saves to store/waweb/ and persists across restarts.');
    info('Then use /wa in Telegram to access your chats.');
    console.log();
    ok('Message bodies are encrypted at rest and auto-deleted after 3 days.');
    ok('The store/ directory is gitignored and will never be committed.');
  }

  // ── 15. Multi-agent setup (optional) ────────────────────────────────────
  section('Agent team (optional)');

  info('RawClaw can run specialist agents alongside the main bot.');
  info('Each agent is its own Telegram bot with a focused role, its own');
  info('context window, and its own chat on your phone.');
  console.log();
  bullet('Each agent gets its own 1M context window (separate from main)');
  bullet('Agents default to Sonnet (cheaper) — use /model opus when needed');
  bullet('Each agent has its own CLAUDE.md personality and Obsidian folders');
  bullet('A shared hive mind lets agents see what others have done');
  bullet('All agents inherit every feature: voice, files, skills, scheduling');
  console.log();

  const wantAgents = await confirm('Set up specialist agents?', false);
  if (wantAgents) {
    console.log();
    info('Available templates:');
    console.log(`  1. ${c.bold}main${c.reset}      — orchestrator, routes work, reports to you`);
    console.log(`  2. ${c.bold}dev${c.reset}       — code, APIs, deployments, MCP servers`);
    console.log(`  3. ${c.bold}ops${c.reset}       — client success, onboarding, delivery tracking`);
    console.log(`  4. ${c.bold}finance${c.reset}   — budget, costs, revenue monitoring`);
    console.log(`  5. ${c.bold}sales${c.reset}     — copy, DMs, proposals, CRM`);
    console.log(`  6. ${c.bold}content${c.reset}   — YouTube scripts, posts, reels, content calendar`);
    console.log(`  7. ${c.bold}research${c.reset}  — web research, competitor intel, market analysis`);
    console.log(`  8. ${c.bold}comms${c.reset}     — email, Slack, WhatsApp inbox management`);
    console.log(`  9. ${c.bold}support${c.reset}   — customer support, FAQ, ticket triage`);
    console.log();
    info('For each agent, you\'ll need to create a Telegram bot via @BotFather.');
    info('Open Telegram → @BotFather → /newbot → choose a name and username.');
    console.log();
    info('Run the agent creation wizard after setup finishes:');
    console.log();
    console.log(`  ${c.cyan}npm run agent:create${c.reset}`);
    console.log();
    info('It walks you through template selection, bot creation, and configuration.');
    info('Then start each agent in its own terminal:');
    console.log();
    console.log(`  ${c.cyan}npm start -- --agent main${c.reset}      # Terminal 2`);
    console.log(`  ${c.cyan}npm start -- --agent sales${c.reset}     # Terminal 3`);
    console.log(`  ${c.cyan}npm start -- --agent content${c.reset}   # Terminal 4`);
    console.log();
    info('Or install as background services:');
    console.log(`  ${c.cyan}bash scripts/agent-service.sh install comms${c.reset}`);
    console.log();
    info('Full guide: see "Creating a team of agents" in the README.');
  }

  // ── 15b. Business knowledge intake ──────────────────────────────────────────
  section('Load your business context');

  info('RawClaw agents work better when they know your business.');
  info('Answer these questions and every agent will be pre-loaded with your context.');
  console.log();

  const wantBusinessIntake = await confirm('Set up your business knowledge base now?', true);
  if (wantBusinessIntake) {
    console.log();

    // Business basics
    const companyName = await ask('Company name');
    const website = await ask('Website URL', 'https://');
    const whatYouSell = await ask('What do you sell? (one sentence)');
    const icp = await ask('Who is your ideal client? (be specific -- industry, revenue, characteristics)');
    const transformation = await ask('What transformation do you deliver? (before → after)');
    const offerName = await ask('Main offer name');
    const offerPrice = await ask('Investment / price range');
    const guarantee = await ask('Guarantee (or "none")');

    // Brand voice
    console.log();
    info('Brand voice -- how your agents will communicate:');
    const toneDesc = await ask('Describe your tone (e.g., "direct and confident, no-BS" or "warm and educational")');
    const wordsToAvoid = await ask('Words or phrases to NEVER use (comma-separated, or press enter to skip)', '');
    const bannedPhrases = wordsToAvoid ? wordsToAvoid.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Competitors
    console.log();
    info('Competitors (optional -- agents will build profiles for these):');
    const competitorInput = await ask('Top 3 competitor names or URLs (comma-separated, or press enter to skip)', '');
    const competitors = competitorInput ? competitorInput.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Write knowledge files
    const knowledgeDir = path.join(PROJECT_ROOT, 'knowledge', 'client');
    fs.mkdirSync(knowledgeDir, { recursive: true });

    const today = new Date().toISOString().split('T')[0];

    // business.md
    const businessMd = `---
generated: ${today}
owner: ops
status: active
---

# Business Context

## What We Sell

**Company:** ${companyName}
**Website:** ${website}
**One-line description:** ${whatYouSell}

## The Transformation

${transformation}

## Ideal Client Profile (ICP)

${icp}

## Offer Stack

**Main offer:** ${offerName}
**Price:** ${offerPrice}
**Guarantee:** ${guarantee}
`;
    fs.writeFileSync(path.join(knowledgeDir, 'business.md'), businessMd, 'utf-8');
    ok('Created knowledge/client/business.md');

    // brand-voice.md
    const brandVoiceMd = `---
generated: ${today}
owner: ops
status: active
---

# Brand Voice

## Tone

${toneDesc}

## Words We Never Use

${bannedPhrases.length > 0 ? bannedPhrases.map(p => `- ${p}`).join('\n') : '- (none specified)'}
- Generic AI phrases: "game-changing", "revolutionary", "synergy"
- Filler openers: "I hope this finds you well", "I wanted to reach out"
- Em dashes (-- or —)

## Writing Style

- Short sentences. Active voice.
- Lead with the reader's world, not yours.
- Specific beats vague -- numbers and names over adjectives.
- Contractions always.
`;
    fs.writeFileSync(path.join(knowledgeDir, 'brand-voice.md'), brandVoiceMd, 'utf-8');
    ok('Created knowledge/client/brand-voice.md');

    // Competitors placeholder
    if (competitors.length > 0) {
      const competitorDir = path.join(PROJECT_ROOT, 'knowledge', 'competitors');
      fs.mkdirSync(competitorDir, { recursive: true });
      for (const comp of competitors) {
        const slug = comp.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const compFile = path.join(competitorDir, `${slug}.md`);
        if (!fs.existsSync(compFile)) {
          fs.writeFileSync(compFile, `# Competitor: ${comp}\nLast updated: ${today}\n\n> Run the competitor-intel skill to populate this file.\n> "Research [${comp}] using the competitor-intel skill"\n`, 'utf-8');
        }
      }
      ok(`Created ${competitors.length} competitor placeholder(s) in knowledge/competitors/`);
      console.log();
      info(`To build full competitor profiles, ask your research agent:`);
      info(`"Analyze [competitor name] using the competitor-intel skill"`);
    }

    console.log();
    info('Knowledge base created. Agents will load these files automatically.');
    info('Edit them anytime at knowledge/client/ to keep them current.');
  }

  // ── 16. Supabase (v2 feature) ─────────────────────────────────────────────
  section('Cloud Sync — Supabase (optional)');

  info('Supabase enables cloud memory persistence, multi-machine sync,');
  info('and cross-agent memory sharing. It is OPTIONAL — Raw Claw works');
  info('fully offline with just SQLite.');
  console.log();

  const wantSupabase = await confirm('Enable Supabase cloud sync?', false);
  if (wantSupabase) {
    const supabaseUrl = await ask('Supabase project URL (e.g., https://xxx.supabase.co)');
    if (supabaseUrl) {
      env.SUPABASE_URL = supabaseUrl;
      const serviceKey = await ask('Service role key (starts with eyJ...)');
      if (serviceKey) env.SUPABASE_SERVICE_KEY = serviceKey;
      const anonKey = await ask('Anon key (optional, for RLS-scoped access)');
      if (anonKey) env.SUPABASE_ANON_KEY = anonKey;
      const companyId = await ask('Company ID (for multi-tenant isolation)', 'default');
      if (companyId) env.COMPANY_ID = companyId;

      // Test connection
      const sp = spinner('Testing Supabase connection...');
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { 'apikey': serviceKey || anonKey || '' },
        });
        if (resp.ok) {
          sp.stop('ok', 'Supabase connected');
        } else {
          sp.stop('warn', `Supabase returned ${resp.status} — check your keys`);
        }
      } catch (e) {
        sp.stop('fail', `Could not reach Supabase: ${String(e)}`);
      }

      // Append Supabase keys to .env (written after main .env save)
      const sbLines = [
        '',
        '# ── Supabase Cloud Sync ───────────────────────────────────────',
        `SUPABASE_URL=${env.SUPABASE_URL || ''}`,
        `SUPABASE_SERVICE_KEY=${env.SUPABASE_SERVICE_KEY || ''}`,
        `SUPABASE_ANON_KEY=${env.SUPABASE_ANON_KEY || ''}`,
        `COMPANY_ID=${env.COMPANY_ID || ''}`,
      ];
      fs.appendFileSync(envPath, sbLines.join('\n') + '\n', 'utf-8');
      ok('Supabase keys saved to .env');
    }
  }

  // ── 16b. Budget governance (v2 feature) ──────────────────────────────────
  section('Budget Governance (optional)');

  info('Set daily/monthly spending limits per agent to prevent runaway costs.');
  info('Agents will auto-pause when they exceed their budget.');
  console.log();

  const wantBudget = await confirm('Configure budget limits?', false);
  let dailyBudget = '';
  let monthlyBudget = '';
  if (wantBudget) {
    dailyBudget = await ask('Daily budget limit in USD (e.g., 5.00)', '5.00');
    monthlyBudget = await ask('Monthly budget limit in USD (e.g., 100.00)', '100.00');
    env.BUDGET_DAILY_LIMIT = dailyBudget;
    env.BUDGET_MONTHLY_LIMIT = monthlyBudget;
    ok(`Budget: $${dailyBudget}/day, $${monthlyBudget}/month`);
  }

  // ── 16c. Discord webhook (v2 feature) ────────────────────────────────────
  section('Discord Notifications (optional)');

  info('Post heartbeat alerts, budget warnings, and task notifications to Discord.');
  console.log();

  const wantDiscord = await confirm('Enable Discord webhook notifications?', false);
  if (wantDiscord) {
    const webhookUrl = await ask('Discord webhook URL');
    if (webhookUrl) {
      env.DISCORD_WEBHOOK_URL = webhookUrl;
      ok('Discord webhook configured');
    }
    const botToken = await ask('Discord bot token (optional, for DM support)');
    if (botToken) {
      env.DISCORD_BOT_TOKEN = botToken;
      ok('Discord bot token set');
    }
  }

  // ── 17. Summary ───────────────────────────────────────────────────────────
  console.log();
  console.log(`  ${c.cyan}╔════════════════════════════════════════════╗${c.reset}`);
  console.log(`  ${c.cyan}║${c.reset}${c.bold}           RawClaw is ready!             ${c.reset}${c.cyan}║${c.reset}`);
  console.log(`  ${c.cyan}╚════════════════════════════════════════════╝${c.reset}`);
  console.log();

  ok(`Bot: @${botUsername || '(configure TELEGRAM_BOT_TOKEN)'}`);
  env.ALLOWED_CHAT_ID ? ok(`Chat ID: ${env.ALLOWED_CHAT_ID}`) : warn('Chat ID: not set (bot will tell you on first message)');
  env.ANTHROPIC_API_KEY ? ok('Claude: API key (pay-per-token)') : ok('Claude: Max plan subscription');
  wantVoiceIn && env.GROQ_API_KEY ? ok('Voice input: Groq Whisper ✓') : wantVoiceIn ? warn('Voice input: GROQ_API_KEY not set') : info('Voice input: not enabled');
  wantVoiceOut && env.ELEVENLABS_API_KEY ? ok('Voice output: ElevenLabs ✓') : wantVoiceOut ? warn('Voice output: ElevenLabs keys not set') : info('Voice output: not enabled');
  wantVideo && env.GOOGLE_API_KEY ? ok('Video analysis: Gemini ✓') : wantVideo ? warn('Video analysis: GOOGLE_API_KEY not set') : info('Video analysis: not enabled');
  wantWhatsApp ? ok('WhatsApp: run npx tsx scripts/wa-daemon.ts to connect') : info('WhatsApp: not enabled');
  wantSlack && env.SLACK_USER_TOKEN ? ok('Slack: connected') : wantSlack ? warn('Slack: SLACK_USER_TOKEN not set') : info('Slack: not enabled');

  console.log();
  console.log(`  ${c.bold}Start the bot:${c.reset}`);
  console.log();
  console.log(`  ${c.cyan}npm start${c.reset}                    # production (compiled)`);
  console.log(`  ${c.cyan}npm run dev${c.reset}                  # development (tsx, no build needed)`);
  console.log();
  console.log(`  ${c.bold}Check health:${c.reset}`);
  console.log(`  ${c.cyan}npm run status${c.reset}`);
  console.log();

  // ── Tailscale SSH access ──────────────────────────────────────────────────
  let tsInstalled = false;
  try {
    execSync('which tailscale', { stdio: 'pipe' });
    tsInstalled = true;
  } catch { }

  if (tsInstalled) {
    section('Remote SSH Access (Tailscale)');

    // Check if Tailscale is already connected
    let tsIp = '';
    try {
      tsIp = execSync('tailscale ip -4', { stdio: 'pipe', timeout: 5000 }).toString().trim();
    } catch { }

    if (!tsIp) {
      info('Tailscale is installed but not connected.');
      info('Starting Tailscale now (this may open a browser for login)...');
      console.log();
      const tsUp = spawnSync('sudo', ['tailscale', 'up', '--ssh'], { stdio: 'inherit', timeout: 120000 });
      if (tsUp.status === 0) {
        try {
          tsIp = execSync('tailscale ip -4', { stdio: 'pipe', timeout: 5000 }).toString().trim();
        } catch { }
      }
    }

    if (tsIp) {
      const user = process.env.USER || process.env.USERNAME || 'user';
      const hostname = os.hostname();
      ok(`Tailscale connected: ${tsIp}`);
      console.log();

      console.log(`  ${c.bold}SSH into this machine:${c.reset}`);
      console.log(`  ${c.cyan}ssh ${user}@${tsIp}${c.reset}`);
      console.log();

      // Team access
      info('Want to give your team SSH access to this machine?');
      info('They need Tailscale installed on their device and to be on your Tailscale network.');
      console.log();

      const addTeam = await confirm('Share access with your Raw Growth team (Alex & Chris)?', true);
      if (addTeam) {
        console.log();
        info('To add team members to your Tailscale network:');
        console.log();
        console.log(`  ${c.bold}1.${c.reset} Go to ${c.cyan}https://login.tailscale.com/admin/users${c.reset}`);
        console.log(`  ${c.bold}2.${c.reset} Click ${c.bold}Invite users${c.reset}`);
        console.log(`  ${c.bold}3.${c.reset} Enter their email addresses`);
        console.log();
        info('Once they accept and install Tailscale, they can SSH in with:');
        console.log();
        console.log(`  ${c.cyan}ssh ${user}@${tsIp}${c.reset}`);
        console.log();
        info('Or by machine name:');
        console.log(`  ${c.cyan}ssh ${user}@${hostname}${c.reset}`);
        console.log();

        // Send SSH command to Telegram so the team has it
        if (env.TELEGRAM_BOT_TOKEN && env.ALLOWED_CHAT_ID) {
          const sshMsg = [
            'Tailscale SSH access configured.',
            '',
            'SSH commands for team:',
            `ssh ${user}@${tsIp}`,
            `ssh ${user}@${hostname}`,
            '',
            'Team members need:',
            '1. Tailscale installed on their device',
            '2. An invite from your Tailscale admin panel',
            '   https://login.tailscale.com/admin/users',
          ].join('\n');
          try {
            const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            await fetch(tgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: env.ALLOWED_CHAT_ID, text: sshMsg }),
            });
            ok('SSH details sent to Telegram');
          } catch { }
        }
      }
    } else {
      warn('Tailscale did not connect. Run manually: sudo tailscale up --ssh');
    }
  }
  console.log();

  if (PLATFORM === 'darwin') {
    info('Logs: tail -f /tmp/rawclaw.log');
  } else if (PLATFORM === 'linux') {
    info('Logs: journalctl --user -u rawclaw -f');
  }
  console.log();
  info('Edit CLAUDE.md any time to change personality, add context, or update skills.');
  info('Re-run npm run setup to change API keys or service settings.');
  console.log();

  // ── Send "I'm live" Telegram message ────────────────────────────────────
  if (env.TELEGRAM_BOT_TOKEN && env.ALLOWED_CHAT_ID) {
    const hostname = os.hostname();
    const liveMsg = `RawClaw is live on ${hostname}.\n\nClaude Code is connected. Send me a message to get started.`;
    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.ALLOWED_CHAT_ID, text: liveMsg }),
      });
      if (resp.ok) {
        ok('Sent "I\'m live" message to Telegram');
      } else {
        warn('Could not send Telegram message -- check bot token and chat ID');
      }
    } catch {
      warn('Could not reach Telegram API');
    }
  }
  console.log();
}

// ── Platform: macOS ──────────────────────────────────────────────────────────
async function setupMacOS() {
  section('Auto-start (macOS)');

  const dest = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.rawclaw.app.plist');
  const installed = fs.existsSync(dest);

  if (installed) {
    ok('launchd service already installed');
    const reinstall = await confirm('Reinstall / update paths?', false);
    if (!reinstall) return;
  } else {
    const install = await confirm('Install as background service (starts automatically on login)?');
    if (!install) { info('Start manually: npm start'); return; }
  }

  const s = spinner('Installing launchd service...');
  try {
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.rawclaw.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>${path.join(PROJECT_ROOT, 'dist', 'index.js')}</string>
  </array>
  <key>WorkingDirectory</key><string>${PROJECT_ROOT}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>5</integer>
  <key>StandardOutPath</key><string>/tmp/rawclaw.log</string>
  <key>StandardErrorPath</key><string>/tmp/rawclaw.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key><string>production</string>
    <key>PATH</key><string>${process.env.PATH ?? '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'}</string>
    <key>HOME</key><string>${os.homedir()}</string>
  </dict>
</dict>
</plist>`;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, plist, 'utf-8');
    execSync(`launchctl load "${dest}"`, { stdio: 'pipe' });
    s.stop('ok', 'Service installed — starts automatically on login');
    info('Logs: tail -f /tmp/rawclaw.log');
  } catch {
    s.stop('warn', 'Could not install automatically');
    info(`Manual install: launchctl load "${dest}"`);
  }
}

// ── Platform: Linux ──────────────────────────────────────────────────────────
async function setupLinux() {
  section('Auto-start (Linux)');

  const install = await confirm('Install as a systemd user service?');
  if (!install) {
    info('Start manually: npm start');
    info('Or: pm2 start dist/index.js --name rawclaw && pm2 save');
    return;
  }

  const s = spinner('Installing systemd service...');
  try {
    const serviceDir = path.join(os.homedir(), '.config', 'systemd', 'user');
    const servicePath = path.join(serviceDir, 'rawclaw.service');
    const service = `[Unit]
Description=RawClaw Telegram Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_ROOT}
ExecStart=${process.execPath} ${path.join(PROJECT_ROOT, 'dist', 'index.js')}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=HOME=${os.homedir()}

[Install]
WantedBy=default.target
`;
    fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(servicePath, service, 'utf-8');
    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
    execSync('systemctl --user enable rawclaw', { stdio: 'pipe' });
    execSync('systemctl --user start rawclaw', { stdio: 'pipe' });
    s.stop('ok', `Service installed at ${servicePath}`);
    info('Logs: journalctl --user -u rawclaw -f');
  } catch {
    s.stop('warn', 'Could not install automatically');
    info('See README.md for manual systemd setup instructions.');
  }
}

// ── Platform: Windows ────────────────────────────────────────────────────────
function setupWindows() {
  section('Auto-start (Windows)');

  warn('Windows detected.');
  console.log();
  info('Option A — WSL2 (recommended):');
  info('  Install WSL2, clone RawClaw inside the WSL2 filesystem,');
  info('  and re-run setup. Keep ~/.claude/ inside WSL2, not the Windows mount.');
  console.log();
  info('Option B — PM2 (native Windows):');
  console.log(`  ${c.cyan}npm install -g pm2${c.reset}`);
  console.log(`  ${c.cyan}pm2 start dist/index.js --name rawclaw${c.reset}`);
  console.log(`  ${c.cyan}pm2 save${c.reset}`);
  console.log(`  ${c.cyan}pm2 startup${c.reset}  ${c.gray}# follow the instructions it prints${c.reset}`);
}

main()
  .catch((err) => {
    console.error(`\n  ${c.red}Setup failed:${c.reset}`, err);
    process.exit(1);
  })
  .finally(() => rl.close());
