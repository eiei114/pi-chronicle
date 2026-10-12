export const VERIFICATION_CONTRACT = "pi-sdk-behavior-v2";
export const SDK_NAMES = [
  "@earendil-works/pi-agent-core",
  "@earendil-works/pi-ai",
  "@earendil-works/pi-coding-agent",
  "@earendil-works/pi-tui",
];

export const UNHANDLED_ERROR_PATTERN =
  /UnhandledPromiseRejection|unhandled rejection|uncaught exception|uncaughtException|shutdown error/i;
export const EXTENSION_LOAD_ERROR_PATTERN =
  /Failed to load extension|Error loading extension|extension load error/i;

function assertion(id, expected, observed, passed) {
  return {
    id,
    expected,
    observed: typeof observed === "string" ? observed : JSON.stringify(observed),
    passed: passed === true,
  };
}

function findChronicleStatus(records) {
  return records.find(
    (row) =>
      row?.type === "extension_ui_request" &&
      row.method === "setStatus" &&
      row.statusKey === "chronicle" &&
      typeof row.statusText === "string" &&
      row.statusText.startsWith("● ") &&
      row.statusText.endsWith(" · empty"),
  );
}

function findHandledPrompt(records, id) {
  return records.find(
    (row) =>
      row?.type === "response" &&
      row.id === id &&
      row.command === "prompt" &&
      row.success === true &&
      row.data?.disposition === "handled",
  );
}

function findStatusNotification(records) {
  return records.find(
    (row) =>
      row?.type === "extension_ui_request" &&
      row.method === "notify" &&
      row.notifyType === "info" &&
      typeof row.message === "string" &&
      row.message.startsWith("Session: ") &&
      row.message.includes("\nMarks: 0\nBeats: 0\n"),
  );
}

export function behaviorAssertions(name, data) {
  const records = data.records ?? [];
  const status = findChronicleStatus(records);

  if (name === "extension_load") {
    return [
      assertion(
        "extension_registered",
        "The actual Pi host receives the chronicle status registration on session start",
        status ?? null,
        !!status,
      ),
    ];
  }

  if (name === "happy_path") {
    const response = findHandledPrompt(records, "feature-status");
    const notification = findStatusNotification(records);
    return [
      assertion(
        "feature_response",
        "The actual /chronicle:status command returns handled and reports the empty active session",
        { response: response ?? null, notification: notification ?? null },
        !!response && !!notification,
      ),
    ];
  }

  if (name === "error_path") {
    const response = findHandledPrompt(records, "empty-export");
    const warning = records.find(
      (row) =>
        row?.type === "extension_ui_request" &&
        row.method === "notify" &&
        row.notifyType === "warning" &&
        row.message ===
          "Session has no marks or beats yet. Record entries with /chronicle:mark or /chronicle:beat first.",
    );
    const noOutputCreated = Array.isArray(data.projectFiles) && data.projectFiles.length === 0;
    return [
      assertion(
        "handled_error",
        "Exporting an empty active session is handled, warns the user, and creates no project files",
        {
          response: response ?? null,
          warning: warning ?? null,
          projectFiles: data.projectFiles ?? null,
        },
        !!response && !!warning && noOutputCreated,
      ),
    ];
  }

  if (name === "reload_cleanup") {
    const secondRecords = data.second?.records ?? [];
    const secondStatus = findChronicleStatus(secondRecords);
    const response = findHandledPrompt(secondRecords, "reload-status");
    const notification = findStatusNotification(secondRecords);
    const cleanShutdown =
      data.first?.exit_code === 0 &&
      data.second?.exit_code === 0 &&
      !data.first?.hasUnhandledError &&
      !data.second?.hasUnhandledError &&
      !data.first?.hasLoadError &&
      !data.second?.hasLoadError;
    return [
      assertion(
        "reloaded_extension_registered",
        "The second actual Pi process re-registers the chronicle session status",
        secondStatus ?? null,
        !!secondStatus,
      ),
      assertion(
        "reloaded_feature_response",
        "The second actual Pi process handles /chronicle:status and returns the active-session details",
        { response: response ?? null, notification: notification ?? null },
        !!response && !!notification,
      ),
      assertion(
        "clean_shutdown",
        "Both actual Pi processes exit with status 0 and emit no load or unhandled/shutdown errors",
        {
          firstExitCode: data.first?.exit_code ?? null,
          secondExitCode: data.second?.exit_code ?? null,
          firstErrors: data.first?.errors ?? [],
          secondErrors: data.second?.errors ?? [],
        },
        cleanShutdown,
      ),
    ];
  }

  if (name === "host_shell") {
    const result = data.shellResult;
    const output = result?.stdout?.trim() ?? "";
    return [
      assertion(
        "native_shell_boundary",
        "The native host shell launches the locally pinned Pi CLI and prints its exact SDK version",
        {
          exitCode: result?.status ?? null,
          signal: result?.signal ?? null,
          stdout: output,
          stderr: result?.stderr?.trim() ?? "",
          expectedVersion: data.expectedVersion,
        },
        result?.status === 0 &&
          !result.error &&
          output === data.expectedVersion &&
          (result.stderr ?? "").trim() === "",
      ),
    ];
  }

  throw new Error(`Unknown smoke case: ${name}`);
}
