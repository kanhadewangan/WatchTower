import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the project root (works regardless of cwd). In Docker the file
// is excluded via .dockerignore, so env vars come from the container instead;
// dotenv silently skips a missing file.
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env')
});
