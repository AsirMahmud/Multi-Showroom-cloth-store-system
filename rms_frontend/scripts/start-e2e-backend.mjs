import { mkdirSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectDir = resolve(process.cwd(), "../rms_backend/project");
const e2eDir = resolve(projectDir, ".e2e");
const python = process.env.PYTHON || "python";
const settings = "rms.e2e_settings";

rmSync(e2eDir, { recursive: true, force: true });
mkdirSync(resolve(e2eDir, "media"), { recursive: true });

for (const args of [
  ["manage.py", "migrate", "--settings", settings, "--noinput"],
  ["manage.py", "seed_e2e", "--settings", settings],
]) {
  const result = spawnSync(python, args, {
    cwd: projectDir,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const server = spawn(
  python,
  ["manage.py", "runserver", "127.0.0.1:8001", "--settings", settings, "--noreload"],
  {
    cwd: projectDir,
    env: process.env,
    stdio: "inherit",
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code) => process.exit(code ?? 0));
