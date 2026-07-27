import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const packageJsonPath = resolve(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const projectName = sanitizeArtifactName(packageJson.name || "project");
const zipPath = resolve(projectRoot, `${projectName}-deploy.zip`);
const temporaryZipPath = resolve(projectRoot, `.${projectName}-deploy.zip.tmp`);
const deploymentDocumentPath = resolve(projectRoot, "DEPLOYMENT.md");

const alreadyCompressedExtensions = new Set([
  ".7z",
  ".avif",
  ".br",
  ".bz2",
  ".eot",
  ".gif",
  ".gz",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".mp4",
  ".ogg",
  ".pdf",
  ".png",
  ".rar",
  ".svgz",
  ".tgz",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".xz",
  ".zip",
]);

let outputDirectory;

try {
  assertStaticProject();
  removePreviousArtifact(zipPath);
  removePreviousArtifact(temporaryZipPath);

  console.log(`Building ${packageJson.name || "project"} for production...`);
  runProductionBuild();

  outputDirectory = await detectOutputDirectory();
  const validation = validateStaticOutput(outputDirectory);
  console.log(
    `Validated ${relative(projectRoot, outputDirectory)} (${validation.fileCount} files, ${formatBytes(validation.totalBytes)}).`,
  );

  createZip(outputDirectory, temporaryZipPath);
  renameSync(temporaryZipPath, zipPath);

  writeFileSync(
    deploymentDocumentPath,
    createDeploymentDocument(outputDirectory, validation),
    "utf8",
  );

  console.log("Deployment package created successfully.");
  console.log(`Deployment ZIP: ${zipPath}`);
} catch (error) {
  removePreviousArtifact(temporaryZipPath);
  removePreviousArtifact(zipPath);
  console.error(`Deployment packaging failed: ${error.message}`);
  process.exitCode = 1;
}

function sanitizeArtifactName(value) {
  const sanitized = String(value)
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "project";
}

function assertStaticProject() {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (!packageJson.scripts?.build) {
    throw new Error('package.json does not define the required "build" script.');
  }

  if (dependencies.next) {
    throw new Error(
      "Next.js was detected. This packaging script intentionally refuses to assume a static export; verify server-side requirements before packaging.",
    );
  }
}

function removePreviousArtifact(artifactPath) {
  if (!existsSync(artifactPath)) return;

  const artifactName = relative(projectRoot, artifactPath);
  const allowedArtifacts = new Set([
    `${projectName}-deploy.zip`,
    `.${projectName}-deploy.zip.tmp`,
  ]);

  if (!allowedArtifacts.has(artifactName)) {
    throw new Error(`Refusing to remove unexpected path: ${artifactPath}`);
  }

  const artifactStats = lstatSync(artifactPath);
  if (!artifactStats.isFile() && !artifactStats.isSymbolicLink()) {
    throw new Error(`Refusing to remove non-file deployment artifact: ${artifactPath}`);
  }

  rmSync(artifactPath);
}

function runProductionBuild() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const buildResult = spawnSync(npmCommand, ["run", "build"], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (buildResult.error) {
    throw new Error(`could not start the production build: ${buildResult.error.message}`);
  }

  if (buildResult.status !== 0) {
    const reason = buildResult.signal
      ? `terminated by signal ${buildResult.signal}`
      : `exited with status ${buildResult.status}`;
    throw new Error(`production build ${reason}.`);
  }
}

async function detectOutputDirectory() {
  const configuredCandidates = [];
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (dependencies.vite) {
    try {
      const { resolveConfig } = await import("vite");
      const viteConfig = await resolveConfig({}, "build", "production");
      configuredCandidates.push(viteConfig.build?.outDir || "dist");
    } catch (error) {
      console.warn(`Could not read the Vite output setting: ${error.message}`);
    }
  }

  const candidates = [
    ...configuredCandidates,
    "dist",
    "out",
    "build",
    ".output/public",
  ];

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    const candidatePath = isAbsolute(candidate)
      ? resolve(candidate)
      : resolve(projectRoot, candidate);

    assertSafeOutputPath(candidatePath);

    if (
      existsSync(candidatePath) &&
      lstatSync(candidatePath).isDirectory() &&
      existsSync(resolve(candidatePath, "index.html"))
    ) {
      return candidatePath;
    }
  }

  throw new Error(
    `no valid static output directory was found (checked: ${[
      ...new Set(candidates),
    ].join(", ")}).`,
  );
}

function assertSafeOutputPath(outputPath) {
  const relativePath = relative(projectRoot, outputPath);

  if (
    outputPath === projectRoot ||
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`refusing to package a path outside the project: ${outputPath}`);
  }
}

function validateStaticOutput(outputPath) {
  assertSafeOutputPath(outputPath);

  const realProjectRoot = realpathSync(projectRoot);
  const realOutputPath = realpathSync(outputPath);
  const outputRelativePath = relative(realProjectRoot, realOutputPath);

  if (
    outputRelativePath === "" ||
    outputRelativePath === ".." ||
    outputRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(outputRelativePath)
  ) {
    throw new Error(`resolved output directory is unsafe: ${realOutputPath}`);
  }

  const indexPath = resolve(realOutputPath, "index.html");
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    throw new Error("production output is missing index.html.");
  }

  const indexHtml = readFileSync(indexPath, "utf8");
  if (!/<!doctype html|<html[\s>]/i.test(indexHtml)) {
    throw new Error("production index.html does not contain valid HTML markup.");
  }

  const localReferences = extractLocalReferences(indexHtml);
  const scriptReferences = localReferences.filter(({ tag }) => tag === "script");

  if (scriptReferences.length === 0) {
    throw new Error("production index.html does not reference a JavaScript entry file.");
  }

  for (const { reference } of localReferences) {
    const referencedPath = resolveOutputReference(realOutputPath, reference);
    if (!existsSync(referencedPath) || !statSync(referencedPath).isFile()) {
      throw new Error(`production entry file is missing: ${reference}`);
    }
  }

  const files = collectOutputFiles(realOutputPath);
  if (files.length < 2) {
    throw new Error("production output is incomplete; fewer than two files were generated.");
  }

  return {
    fileCount: files.length,
    files,
    totalBytes: files.reduce((total, file) => total + file.stats.size, 0),
  };
}

function extractLocalReferences(indexHtml) {
  const references = [];
  const tagPattern = /<(script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi;

  for (const match of indexHtml.matchAll(tagPattern)) {
    const [, tag, rawReference] = match;
    const reference = rawReference.split(/[?#]/, 1)[0];

    if (
      !reference ||
      reference.startsWith("#") ||
      reference.startsWith("//") ||
      /^[a-z][a-z0-9+.-]*:/i.test(reference)
    ) {
      continue;
    }

    references.push({ tag: tag.toLowerCase(), reference });
  }

  return references;
}

function resolveOutputReference(outputPath, reference) {
  let decodedReference;
  try {
    decodedReference = decodeURIComponent(reference);
  } catch {
    throw new Error(`production index.html contains an invalid URL: ${reference}`);
  }

  const normalizedReference = decodedReference.replace(/^\/+/, "");
  const referencedPath = resolve(outputPath, normalizedReference);
  const relativePath = relative(outputPath, referencedPath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`production index.html references a path outside the output: ${reference}`);
  }

  return referencedPath;
}

function collectOutputFiles(directory, baseDirectory = directory) {
  const files = [];
  const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`symbolic links are not allowed in deployment output: ${entryPath}`);
    }

    if (entry.isDirectory()) {
      files.push(...collectOutputFiles(entryPath, baseDirectory));
      continue;
    }

    if (!entry.isFile()) {
      throw new Error(`unsupported filesystem entry in deployment output: ${entryPath}`);
    }

    files.push({
      absolutePath: entryPath,
      archivePath: relative(baseDirectory, entryPath).split(sep).join("/"),
      stats: statSync(entryPath),
    });
  }

  return files;
}

function createZip(outputPath, destinationPath) {
  const files = collectOutputFiles(outputPath);
  if (files.length > 0xffff) {
    throw new Error("deployment output contains too many files for a standard ZIP archive.");
  }

  mkdirSync(dirname(destinationPath), { recursive: true });
  const destination = openSync(destinationPath, "wx");
  const centralDirectoryRecords = [];
  let archiveOffset = 0;

  try {
    for (const file of files) {
      const source = readFileSync(file.absolutePath);
      if (source.length > 0xffffffff) {
        throw new Error(`file is too large for a standard ZIP archive: ${file.archivePath}`);
      }

      const extension = extname(file.archivePath).toLowerCase();
      const compressionMethod = alreadyCompressedExtensions.has(extension) ? 0 : 8;
      const payload =
        compressionMethod === 0 ? source : deflateRawSync(source, { level: 9 });
      const fileName = Buffer.from(file.archivePath, "utf8");
      const checksum = crc32(source);
      const { dosDate, dosTime } = toDosDateTime(file.stats.mtime);

      if (payload.length > 0xffffffff || archiveOffset > 0xffffffff) {
        throw new Error("deployment package is too large for a standard ZIP archive.");
      }

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0x0800, 6);
      localHeader.writeUInt16LE(compressionMethod, 8);
      localHeader.writeUInt16LE(dosTime, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(checksum, 14);
      localHeader.writeUInt32LE(payload.length, 18);
      localHeader.writeUInt32LE(source.length, 22);
      localHeader.writeUInt16LE(fileName.length, 26);
      localHeader.writeUInt16LE(0, 28);

      writeBuffer(destination, localHeader);
      writeBuffer(destination, fileName);
      writeBuffer(destination, payload);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(0x0314, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(compressionMethod, 10);
      centralHeader.writeUInt16LE(dosTime, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(checksum, 16);
      centralHeader.writeUInt32LE(payload.length, 20);
      centralHeader.writeUInt32LE(source.length, 24);
      centralHeader.writeUInt16LE(fileName.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(((file.stats.mode & 0xffff) << 16) >>> 0, 38);
      centralHeader.writeUInt32LE(archiveOffset, 42);

      centralDirectoryRecords.push(Buffer.concat([centralHeader, fileName]));
      archiveOffset += localHeader.length + fileName.length + payload.length;
    }

    const centralDirectoryOffset = archiveOffset;
    for (const record of centralDirectoryRecords) {
      writeBuffer(destination, record);
      archiveOffset += record.length;
    }

    const centralDirectorySize = archiveOffset - centralDirectoryOffset;
    if (centralDirectorySize > 0xffffffff || centralDirectoryOffset > 0xffffffff) {
      throw new Error("deployment package is too large for a standard ZIP archive.");
    }

    const endOfCentralDirectory = Buffer.alloc(22);
    endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
    endOfCentralDirectory.writeUInt16LE(0, 4);
    endOfCentralDirectory.writeUInt16LE(0, 6);
    endOfCentralDirectory.writeUInt16LE(files.length, 8);
    endOfCentralDirectory.writeUInt16LE(files.length, 10);
    endOfCentralDirectory.writeUInt32LE(centralDirectorySize, 12);
    endOfCentralDirectory.writeUInt32LE(centralDirectoryOffset, 16);
    endOfCentralDirectory.writeUInt16LE(0, 20);
    writeBuffer(destination, endOfCentralDirectory);
  } finally {
    closeSync(destination);
  }
}

function writeBuffer(fileDescriptor, buffer) {
  let offset = 0;

  while (offset < buffer.length) {
    offset += writeSync(fileDescriptor, buffer, offset, buffer.length - offset);
  }
}

function toDosDateTime(date) {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    dosDate: ((year - 1980) << 9) | (month << 5) | day,
    dosTime: (hours << 11) | (minutes << 5) | seconds,
  };
}

function crc32(buffer) {
  const table =
    crc32.table ||
    (crc32.table = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    }));

  let checksum = 0xffffffff;
  for (const byte of buffer) {
    checksum = table[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unit = "B";

  for (const nextUnit of units) {
    value /= 1024;
    unit = nextUnit;
    if (value < 1024) break;
  }

  return `${value.toFixed(1)} ${unit}`;
}

function createDeploymentDocument(outputPath, validation) {
  const outputDirectoryName = relative(projectRoot, outputPath).split(sep).join("/");
  const zipFileName = `${projectName}-deploy.zip`;

  return `# Deployment

This file is generated by \`npm run deploy:package\`.

## Detected project setup

| Setting | Detected value |
| --- | --- |
| Framework | React 18 with Vite 6 |
| Package manager | npm (\`package-lock.json\`) |
| Production build | \`npm run build\` → \`vite build\` |
| Build output | \`${outputDirectoryName}/\` |
| Runtime | Static files; no Node.js server is required |
| Client routing | React Router with \`BrowserRouter\` |
| Routing fallback | Required: unknown paths must serve \`/index.html\` |

The validated output currently contains ${validation.fileCount} files (${formatBytes(
    validation.totalBytes,
  )} before ZIP compression).

## Create the deployment ZIP

\`\`\`bash
npm ci
npm run deploy:package
\`\`\`

The command runs the existing production build, validates its entry files, and creates:

\`\`\`text
${zipFileName}
\`\`\`

The ZIP contains the contents of \`${outputDirectoryName}/\` directly at its root. Upload the extracted contents, not an extra parent folder.

## Hosting configuration

### Netlify or Cloudflare Pages

- Build command: \`npm run build\`
- Publish/output directory: \`${outputDirectoryName}\`
- SPA fallback: already included as \`_redirects\` in the built output

The packaged \`_redirects\` file contains:

\`\`\`text
/* /index.html 200
\`\`\`

### Vercel

- Framework preset: Vite
- Build command: \`npm run build\`
- Output directory: \`${outputDirectoryName}\`
- Add a rewrite from all non-file application routes to \`/index.html\`

### Apache

Enable URL rewriting and route requests for files that do not exist to \`/index.html\`. A typical document-root \`.htaccess\` is:

\`\`\`apache
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
\`\`\`

### Nginx

Use an SPA fallback in the site location:

\`\`\`nginx
location / {
    try_files $uri $uri/ /index.html;
}
\`\`\`

## Important

- Deploy this as a static site. Do not run the Vite development server in production.
- Keep the SPA fallback enabled so direct visits to routes such as \`/proyectos/\` or \`/en/projects/\` work.
- If the site is hosted under a subdirectory instead of a domain root, configure Vite's \`base\` path before building.
- If the production build or entry-file validation fails, the packaging command exits with an error and leaves no deployment ZIP.
`;
}
