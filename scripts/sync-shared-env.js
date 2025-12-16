#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envDir = path.resolve(__dirname, '../env');
const SHARED_PUBLIC = 'common.env';
const SHARED_SECRET = 'common.env.user';

function parseEntries(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (key) entries[key] = value;
  }
  return entries;
}

function updateEnvFile(targetPath, newEntries) {
  const original = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  const lines = original.split(/\r?\n/);
  const keyLineIndex = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      keyLineIndex.set(match[1], i);
    }
  }

  let changed = false;
  for (const [key, value] of Object.entries(newEntries)) {
    const newLine = `${key}=${value}`;
    if (keyLineIndex.has(key)) {
      const idx = keyLineIndex.get(key);
      if (lines[idx] !== newLine) {
        lines[idx] = newLine;
        changed = true;
      }
    } else {
      if (lines.length && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      lines.push(newLine);
      changed = true;
    }
  }

  if (changed) {
    const updated = lines.join('\n').replace(/\n+$/, '\n');
    fs.writeFileSync(targetPath, updated, 'utf8');
  }
  return changed;
}

const publicEntriesPath = path.join(envDir, SHARED_PUBLIC);
const secretEntriesPath = path.join(envDir, SHARED_SECRET);

const publicEntries = fs.existsSync(publicEntriesPath) ? parseEntries(publicEntriesPath) : {};
const secretEntries = fs.existsSync(secretEntriesPath) ? parseEntries(secretEntriesPath) : {};

if (!Object.keys(publicEntries).length && !Object.keys(secretEntries).length) {
  process.exit(0);
}

const entriesForUserFiles = { ...publicEntries, ...secretEntries };
const entriesForEnvFiles = { ...publicEntries };

const envFiles = [];
const userFiles = [];

for (const name of fs.readdirSync(envDir)) {
  if (!name.startsWith('.env.')) continue;
  if (name === SHARED_PUBLIC || name === SHARED_SECRET) continue;
  const fullPath = path.join(envDir, name);
  if (name.endsWith('.user')) {
    userFiles.push(fullPath);
  } else if (!name.endsWith('.template')) {
    envFiles.push(fullPath);
  }
}

let updates = 0;

for (const file of envFiles) {
  if (Object.keys(entriesForEnvFiles).length && updateEnvFile(file, entriesForEnvFiles)) {
    updates++;
    console.log(`Synced shared entries into ${path.relative(envDir, file)}`);
  }
}

for (const file of userFiles) {
  if (Object.keys(entriesForUserFiles).length && updateEnvFile(file, entriesForUserFiles)) {
    updates++;
    console.log(`Synced shared entries into ${path.relative(envDir, file)}`);
  }
}

if (!updates) {
  console.log('Shared environment entries already in sync.');
}
