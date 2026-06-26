import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const nextBin = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: "http://127.0.0.1:8001/api",
  NEXT_PUBLIC_ALLOW_LOCAL_API: "true",
};
const build = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const server = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3100"],
  {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code) => process.exit(code ?? 0));
