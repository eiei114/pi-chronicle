import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import {
  behaviorAssertions,
  EXTENSION_LOAD_ERROR_PATTERN,
  SDK_NAMES,
  UNHANDLED_ERROR_PATTERN,
  VERIFICATION_CONTRACT,
} from "./pi-sdk-smoke-contract.mjs";

const TIMEOUT_MS = 15_000;
const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "docs/verification/pi-sdk-smoke.json");
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const frozenVersions = {
  "@earendil-works/pi-agent-core": "1.1.0",
  "@earendil-works/pi-ai": "1.1.0",
  "@earendil-works/pi-coding-agent": "1.1.0",
  "@earendil-works/pi-tui": "1.1.0",
};
const requiredAssertionIds = {
  extension_load: ["extension_registered"],
  happy_path: ["feature_response"],
  error_path: ["handled_error"],
  reload_cleanup: [
    "reloaded_extension_registered",
    "reloaded_feature_response",
    "clean_shutdown",
  ],
  host_shell: ["native_shell_boundary"],
};

const sdkVersions = Object.fromEntries(
  SDK_NAMES.map((name) => {
    const installed = JSON.parse(
      readFileSync(resolve(root, "node_modules", name, "package.json"), "utf8"),
    ).version;
    if (manifest.devDependencies?.[name] !== frozenVersions[name] || installed !== frozenVersions[name]) {
      throw new Error(
        `Smoke requires exact SDK ${name}@${frozenVersions[name]} dev/test pin; manifest=${manifest.devDependencies?.[name]}, installed=${installed}`,
      );
    }
    return [name, installed];
  }),
);

const piManifest = JSON.parse(
  readFileSync(resolve(root, "node_modules/@earendil-works/pi-coding-agent/package.json"), "utf8"),
);
const piCli = resolve(root, "node_modules/@earendil-works/pi-coding-agent", piManifest.bin.pi);
const agentDir = mkdtempSync(resolve(tmpdir(), "pi-chronicle-sdk-smoke-"));
const projectDir = resolve(agentDir, "project");
mkdirSync(projectDir);
const env = {
  ...process.env,
  PI_CODING_AGENT_DIR: resolve(agentDir, "agent"),
  PI_OFFLINE: "1",
};
mkdirSync(env.PI_CODING_AGENT_DIR);

const rpcArgs = [
  piCli,
  "--mode",
  "rpc",
  "--offline",
  "--no-session",
  "--no-tools",
  "--no-extensions",
  "--no-skills",
  "--no-context-files",
  "--no-prompt-templates",
  "--no-mcp",
  "-e",
  root,
];

function parseJsonLines(output) {
  const records = [];
  const invalidLines = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      invalidLines.push(line);
    }
  }
  return { records, invalidLines };
}

function sanitizeEvidence(text) {
  return text
    .replaceAll(root, "<package-root>")
    .replaceAll(agentDir, "<temporary-agent-dir>")
    .replaceAll(projectDir, "<temporary-project-dir>")
    .replaceAll(piCli, "<pinned-pi-cli>")
    .replaceAll(process.execPath, "node");
}

function runPi(input) {
  const command =
    "node node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js --mode rpc --offline --no-session --no-tools --no-extensions --no-skills --no-context-files --no-prompt-templates --no-mcp -e <package-root>";
  const result = spawnSync(process.execPath, rpcArgs, {
    cwd: projectDir,
    env,
    input: `${JSON.stringify(input)}\n`,
    encoding: "utf8",
    timeout: TIMEOUT_MS,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const parsed = parseJsonLines(stdout);
  const fullOutput = `${stdout}${stderr}`;
  const hasUnhandledError = UNHANDLED_ERROR_PATTERN.test(fullOutput);
  const hasLoadError = EXTENSION_LOAD_ERROR_PATTERN.test(fullOutput);
  const exit_code = result.status ?? (result.error?.code === "ETIMEDOUT" ? 124 : 1);
  const resultRecord = {
    command,
    input: JSON.stringify(input),
    exit_code,
    signal: result.signal ?? null,
    error: result.error?.message ?? null,
    stdout,
    stderr,
    records: parsed.records,
    invalidLines: parsed.invalidLines,
    hasUnhandledError,
    hasLoadError,
    processPassed:
      result.status === 0 &&
      !result.error &&
      parsed.invalidLines.length === 0 &&
      !hasUnhandledError &&
      !hasLoadError,
  };
  return resultRecord;
}

function evidenceFor(processes, projectFiles) {
  return JSON.stringify(
    {
      timeout_ms: TIMEOUT_MS,
      actual_process: true,
      sdk_versions: sdkVersions,
      processes: processes.map((process) => ({
        command: process.command,
        input: process.input,
        exit_code: process.exit_code,
        signal: process.signal,
        error: process.error ? sanitizeEvidence(process.error) : null,
        stdout: sanitizeEvidence(process.stdout),
        stderr: sanitizeEvidence(process.stderr),
        invalid_stdout_lines: process.invalidLines,
      })),
      project_files: projectFiles,
      capture_artifact: "docs/verification/pi-sdk-smoke.json",
    },
    null,
    2,
  );
}

function makeCase(name, processes, assertions, extra = {}) {
  const fullOutput = processes.map((process) => `${process.stdout}${process.stderr}`).join("\n");
  const exit_code = processes.every((process) => process.exit_code === 0) ? 0 : 1;
  const passed =
    processes.every((process) => process.processPassed) &&
    assertions.every((item) => item.passed);
  return {
    name,
    command: "npm run smoke:pi",
    exit_code,
    passed,
    evidence: evidenceFor(processes, extra.projectFiles ?? []),
    assertions,
    hasUnhandledError: processes.some((process) => process.hasUnhandledError),
    hasLoadError: processes.some((process) => process.hasLoadError),
  };
}

function runNativeShell() {
  const expectedVersion = sdkVersions["@earendil-works/pi-coding-agent"];
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot ?? "C:/Windows";
    const powershell = resolve(
      systemRoot,
      "System32/WindowsPowerShell/v1.0/powershell.exe",
    );
    if (!existsSync(powershell)) {
      return {
        result: { status: null, signal: null, stdout: "", stderr: "Windows PowerShell executable not found" },
        command: powershell,
      };
    }
    const quote = (value) => `'${value.replaceAll("'", "''")}'`;
    const command = `& ${quote(process.execPath)} ${quote(piCli)} --no-extensions --version; exit $LASTEXITCODE`;
    return {
      result: spawnSync(
        powershell,
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command],
        {
          cwd: projectDir,
          env,
          encoding: "utf8",
          timeout: TIMEOUT_MS,
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        },
      ),
      command:
        "powershell.exe -NoLogo -NoProfile -NonInteractive -Command '& node <pinned-pi-cli> --no-extensions --version; exit $LASTEXITCODE'",
    };
  }

  const command = '"$1" "$2" --no-extensions --version';
  return {
    result: spawnSync(
      "/bin/sh",
      ["-c", command, "pi-chronicle-host-shell", process.execPath, piCli],
      {
        cwd: projectDir,
        env,
        encoding: "utf8",
        timeout: TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      },
    ),
    command:
      "/bin/sh -c '\"$1\" \"$2\" --no-extensions --version' pi-chronicle-host-shell node <pinned-pi-cli>",
  };
}

function validateReport(report) {
  if (report.schema_version !== 1 || report.verification_contract !== VERIFICATION_CONTRACT) {
    throw new Error("Smoke report has an unsupported schema or verification contract");
  }
  if (JSON.stringify(report.sdk_versions) !== JSON.stringify(frozenVersions)) {
    throw new Error("Smoke report SDK versions do not match the frozen wave");
  }
  if (report.unhandled_errors !== 0 || report.extension_load_errors !== 0) {
    throw new Error("Smoke report recorded an unhandled or extension-load error");
  }
  if (
    JSON.stringify(report.cases.map((item) => item.name)) !==
    JSON.stringify(Object.keys(requiredAssertionIds))
  ) {
    throw new Error("Smoke report must contain each of the five required cases in order");
  }
  for (const item of report.cases) {
    const assertions = item.assertions ?? [];
    const ids = assertions.map((assertion) => assertion.id);
    if (
      JSON.stringify(ids) !== JSON.stringify(requiredAssertionIds[item.name]) ||
      assertions.some(
        (assertion) =>
          typeof assertion.expected !== "string" ||
          typeof assertion.observed !== "string" ||
          typeof assertion.passed !== "boolean",
      )
    ) {
      throw new Error(`Smoke report assertions are incomplete for ${item.name}`);
    }
  }
}

try {
  const load = runPi({ id: "load-state", type: "get_state" });
  const extensionLoad = makeCase(
    "extension_load",
    [load],
    behaviorAssertions("extension_load", { records: load.records }),
  );

  const happy = runPi({
    id: "feature-status",
    type: "prompt",
    message: "/chronicle:status",
  });
  const happyPath = makeCase(
    "happy_path",
    [happy],
    behaviorAssertions("happy_path", { records: happy.records }),
  );

  const negative = runPi({
    id: "empty-export",
    type: "prompt",
    message: "/chronicle:export",
  });
  const projectFiles = readdirSync(projectDir);
  const errorPath = makeCase(
    "error_path",
    [negative],
    behaviorAssertions("error_path", {
      records: negative.records,
      projectFiles,
    }),
    { projectFiles },
  );

  const firstReloadProcess = runPi({ id: "reload-first", type: "get_state" });
  const secondReloadProcess = runPi({
    id: "reload-status",
    type: "prompt",
    message: "/chronicle:status",
  });
  const reloadCleanup = makeCase(
    "reload_cleanup",
    [firstReloadProcess, secondReloadProcess],
    behaviorAssertions("reload_cleanup", {
      first: {
        exit_code: firstReloadProcess.exit_code,
        hasUnhandledError: firstReloadProcess.hasUnhandledError,
        hasLoadError: firstReloadProcess.hasLoadError,
        errors: [firstReloadProcess.error].filter(Boolean),
      },
      second: {
        records: secondReloadProcess.records,
        exit_code: secondReloadProcess.exit_code,
        hasUnhandledError: secondReloadProcess.hasUnhandledError,
        hasLoadError: secondReloadProcess.hasLoadError,
        errors: [secondReloadProcess.error].filter(Boolean),
      },
    }),
  );

  const shell = runNativeShell();
  const hostShell = makeCase(
    "host_shell",
    [],
    behaviorAssertions("host_shell", {
      shellResult: shell.result,
      expectedVersion: sdkVersions["@earendil-works/pi-coding-agent"],
    }),
    {
      shellResult: shell.result,
      shellCommand: shell.command,
    },
  );
  hostShell.command = "npm run smoke:pi";
  hostShell.evidence = JSON.stringify(
    {
      timeout_ms: TIMEOUT_MS,
      actual_process: true,
      sdk_versions: sdkVersions,
      native_shell_command: shell.command,
      process: {
        exit_code: shell.result.status ?? null,
        signal: shell.result.signal ?? null,
        error: shell.result.error ? sanitizeEvidence(shell.result.error.message) : null,
        stdout: sanitizeEvidence(shell.result.stdout ?? ""),
        stderr: sanitizeEvidence(shell.result.stderr ?? ""),
      },
      capture_artifact: "docs/verification/pi-sdk-smoke.json",
    },
    null,
    2,
  );
  hostShell.exit_code = shell.result.status ?? (shell.result.error?.code === "ETIMEDOUT" ? 124 : 1);
  hostShell.passed = hostShell.assertions.every((item) => item.passed) && !shell.result.error;
  hostShell.hasUnhandledError = UNHANDLED_ERROR_PATTERN.test(
    `${shell.result.stdout ?? ""}${shell.result.stderr ?? ""}`,
  );
  hostShell.hasLoadError = EXTENSION_LOAD_ERROR_PATTERN.test(
    `${shell.result.stdout ?? ""}${shell.result.stderr ?? ""}`,
  );

  const cases = [extensionLoad, happyPath, errorPath, reloadCleanup, hostShell];
  const report = {
    schema_version: 1,
    verification_contract: VERIFICATION_CONTRACT,
    sdk_versions: sdkVersions,
    platform: process.platform,
    model_inference: "none; actual Pi 1.1.0 host handles deterministic extension RPC commands",
    isolated_agent_dir: true,
    process_timeout_ms: TIMEOUT_MS,
    unhandled_errors: cases.filter((item) => item.hasUnhandledError).length,
    extension_load_errors: cases.filter(
      (item) => item.hasLoadError || (item.name === "extension_load" && !item.passed),
    ).length,
    cases: cases.map(({ hasUnhandledError, hasLoadError, ...item }) => item),
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  validateReport(JSON.parse(readFileSync(reportPath, "utf8")));
  console.log(
    JSON.stringify({
      verification_contract: VERIFICATION_CONTRACT,
      platform: process.platform,
      cases: cases.map(({ name, passed, exit_code }) => ({ name, passed, exit_code })),
      report: "docs/verification/pi-sdk-smoke.json",
    }),
  );
  if (cases.some((item) => !item.passed)) process.exitCode = 1;
} finally {
  rmSync(agentDir, { recursive: true, force: true });
}
