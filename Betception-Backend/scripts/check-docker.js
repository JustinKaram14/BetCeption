#!/usr/bin/env node
import { execSync } from 'node:child_process';

try {
  execSync('docker info', { stdio: 'ignore' });
} catch (error) {
  console.error('Docker daemon is not running. Please start Docker Desktop or the Docker service and retry.');
  process.exit(1);
}
