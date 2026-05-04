#!/usr/bin/env node
import { rmSync } from 'node:fs';

for (const file of process.argv.slice(2)) {
  rmSync(file, { force: true });
}
