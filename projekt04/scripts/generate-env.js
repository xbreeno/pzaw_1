import { writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env");

function randomHex(bytes = 16) {
  return randomBytes(bytes).toString("hex");
}

function randomPassword(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function parseArgs(argv) {
  const options = { force: false };
  argv.forEach((arg) => {
    if (arg === "--force" || arg === "-f") {
      options.force = true;
      return;
    }
    const [key, value] = arg.split("=");
    if (!value) return;
    switch (key) {
      case "--admin-username":
        options.adminUsername = value;
        break;
      case "--admin-password":
        options.adminPassword = value;
        break;
      case "--pepper":
        options.pepper = value;
        break;
      case "--secret":
        options.secret = value;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  });
  return options;
}

function printUsage() {
  console.log("Usage: node scripts/generate-env.js [options]");
  console.log("Options:");
  console.log("  --admin-username=<username>   Set the admin username (default: admin)");
  console.log("  --admin-password=<password>   Set the admin password (default: random)");
  console.log("  --pepper=<hex>                Set the Argon2 pepper value (default: random)");
  console.log("  --secret=<hex>                Set the app secret value (default: random)");
  console.log("  --force, -f                   Overwrite existing .env file");
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printUsage();
  process.exit(0);
}

if (existsSync(envPath) && !options.force) {
  console.error(`.env already exists at ${envPath}. Use --force to overwrite.`);
  process.exit(1);
}

const secret = options.secret || randomHex(32);
const pepper = options.pepper || randomHex(32);
const adminUsername = options.adminUsername || "admin";
const adminPassword = options.adminPassword || randomPassword(16);

const envContent = `SECRET=${secret}
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD=${adminPassword}
PEPPER=${pepper}
NODE_ENV=development
`;

writeFileSync(envPath, envContent, { encoding: "utf8" });
console.log(`Created .env at ${envPath}`);
console.log("Remember to keep .env out of source control.");
console.log(`ADMIN_USERNAME=${adminUsername}`);
console.log(`ADMIN_PASSWORD=${adminPassword}`);
