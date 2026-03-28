import { spawn } from "child_process";
import path from "path";

function toDockerPath(absolutePath) {
  if (/^[A-Za-z]:\\/.test(absolutePath)) {
    const drive = absolutePath.slice(0, 1).toLowerCase();
    const rest = absolutePath.slice(2).replace(/\\/g, "/");
    return `/${drive}${rest}`;
  }

  return absolutePath.replace(/\\/g, "/");
}

function run() {
  const [, , scriptPath, ...extraArgs] = process.argv;

  if (!scriptPath) {
    console.error("Usage: node scripts/run-k6.mjs <k6-script-path> [extra args]");
    process.exit(1);
  }

  const cwd = process.cwd();
  const dockerWorkdir = "/work";
  const dockerMountPath = toDockerPath(cwd);
  const resolvedScriptPath = scriptPath.split(path.sep).join("/");

  const args = [
    "run",
    "--rm",
    "-i",
    "-v",
    `${dockerMountPath}:${dockerWorkdir}`,
    "-w",
    dockerWorkdir,
    "-e",
    `LOAD_BASE_URL=${process.env.LOAD_BASE_URL ?? "http://127.0.0.1:3000"}`,
    "-e",
    `LOAD_VUS=${process.env.LOAD_VUS ?? "6"}`,
    "-e",
    `LOAD_DURATION=${process.env.LOAD_DURATION ?? "20s"}`,
    "-e",
    `LOAD_SLEEP_MS=${process.env.LOAD_SLEEP_MS ?? "250"}`,
    "grafana/k6",
    "run",
    ...extraArgs,
    resolvedScriptPath,
  ];

  const child = spawn("docker", args, {
    stdio: "inherit",
    cwd,
    shell: false,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error("k6 run failed. Ensure Docker Desktop daemon is running and reachable.");
    }

    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("Failed to run dockerized k6:", error);
    process.exit(1);
  });
}

run();
