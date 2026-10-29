import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const envPath = path.join(serverRoot, '.env');
const defaultLocalUri = 'mongodb://127.0.0.1:27017/blogsphere';
const dbPath = path.join(projectRoot, '.data', 'mongodb');
const dbUriPath = path.join(projectRoot, '.data', 'mongodb-uri');

if (existsSync(envPath)) dotenv.config({ path: envPath });

let localMongo;
let devProcesses;
let stopping;

async function stopAll(signal = 'SIGTERM', exitCode = 0) {
  if (stopping) return stopping;
  stopping = (async () => {
    if (devProcesses && devProcesses.exitCode === null) {
      await new Promise(resolve => {
        const timeout = setTimeout(() => {
          devProcesses.kill('SIGKILL');
          resolve();
        }, 5000);
        timeout.unref();
        devProcesses.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
        devProcesses.kill(signal);
      });
    }
    await localMongo?.stop();
    process.exitCode = exitCode;
  })();
  return stopping;
}

process.once('SIGINT', () => { void stopAll('SIGINT'); });
process.once('SIGTERM', () => { void stopAll('SIGTERM'); });

async function apiIsAlreadyHealthy() {
  try {
    const response = await fetch('http://127.0.0.1:4000/api/posts', { signal: AbortSignal.timeout(900) });
    const body = await response.json();
    return response.ok && body.success === true;
  } catch {
    return false;
  }
}

async function findRunningVitePort() {
  const ports = Array.from({ length: 27 }, (_, index) => 5173 + index);
  const responses = await Promise.all(ports.map(async port => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/@vite/client`, { signal: AbortSignal.timeout(400) });
      return response.ok ? port : null;
    } catch {
      return null;
    }
  }));
  return responses.find(Boolean) ?? null;
}

async function activeMongoPid() {
  try {
    const pid = Number((await readFile(path.join(dbPath, 'mongod.lock'), 'utf8')).trim());
    if (!Number.isInteger(pid) || pid < 1) return null;
    try {
      process.kill(pid, 0);
      return pid;
    } catch (error) {
      return error.code === 'EPERM' ? pid : null;
    }
  } catch {
    return null;
  }
}

function startDevProcesses(commands) {
  const concurrentlyPath = path.join(projectRoot, 'node_modules', 'concurrently', 'dist', 'bin', 'concurrently.js');
  const names = commands.map(command => command.endsWith('server') ? 'server' : 'client').join(',');
  const colors = commands.map(command => command.endsWith('server') ? 'blue' : 'green').join(',');
  devProcesses = spawn(process.execPath, [concurrentlyPath, '-k', '-n', names, '-c', colors, ...commands], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit'
  });
  devProcesses.once('error', error => {
    console.error('Could not start the BlogSphere development processes:', error.message);
    void stopAll('SIGTERM', 1);
  });
  devProcesses.once('exit', (code, signal) => {
    if (!stopping) void stopAll('SIGTERM', code ?? (signal ? 1 : 0));
  });
}

async function main() {
  const configuredUri = process.env.MONGODB_URI;
  const apiAlreadyRunning = await apiIsAlreadyHealthy();

  if (apiAlreadyRunning) {
    const vitePort = await findRunningVitePort();
    if (vitePort) {
      console.info(`BlogSphere is already running at http://localhost:${vitePort}; reusing it instead of starting a second MongoDB instance.`);
      return;
    }

    console.info('BlogSphere API is already running on port 4000; starting only the web client.');
    startDevProcesses(['npm:dev:client']);
    return;
  }

  if (!configuredUri || configuredUri === defaultLocalUri) {
    const mongoPid = await activeMongoPid();
    if (mongoPid) {
      try {
        const savedUri = (await readFile(dbUriPath, 'utf8')).trim();
        if (!savedUri.startsWith('mongodb://') && !savedUri.startsWith('mongodb+srv://')) {
          throw new Error('The saved MongoDB connection string is invalid.');
        }
        process.env.MONGODB_URI = savedUri;
        console.info(`Reusing the existing local MongoDB process (PID ${mongoPid}).`);
      } catch (error) {
        console.error(`MongoDB process ${mongoPid} is still using .data/mongodb, but its saved connection details could not be read (${error.message}). Stop the existing BlogSphere process cleanly before starting another one.`);
        process.exitCode = 1;
        return;
      }
    } else {
      await mkdir(dbPath, { recursive: true });
      localMongo = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
      process.env.MONGODB_URI = localMongo.getUri('blogsphere');
      await writeFile(dbUriPath, process.env.MONGODB_URI, 'utf8');
      console.info('Local MongoDB is ready. BlogSphere data will persist under .data/mongodb.');
    }
  } else {
    console.info('Using the MongoDB URI configured in server/.env.');
  }

  startDevProcesses(['npm:dev:server', 'npm:dev:client']);
}

main().catch(async error => {
  console.error('Could not start BlogSphere local development:', error.message);
  await localMongo?.stop();
  process.exitCode = 1;
});
