import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..');
export const CONFIG_DIR = join(ROOT, 'config');
export const PUBLIC_DIR = join(ROOT, 'web', 'public');
