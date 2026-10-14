import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { behaviorAssertions } from "../scripts/pi-sdk-smoke-contract.mjs";

const status = {
  type: "extension_ui_request",
  method: "setStatus",
  statusKey: "chronicle",
  statusText: "● scratch · empty",
};
const handledStatus = {
  id: "feature-status",
  type: "response",
  command: "prompt",
  success: true,
  data: { disposition: "handled" },
};
const statusNotification = {
  type: "extension_ui_request",
  method: "notify",
  notifyType: "info",
  message:
    "Session: 2026-10-12\nProject: scratch\nStarted: 15:04 (just now)\nMarks: 0\nBeats: 0\n\nSession has no marks or beats yet.",
};
const handledEmptyExport = {
  id: "empty-export",
  type: "response",
  command: "prompt",
  success: true,
  data: { disposition: "handled" },
};
const emptyExportWarning = {
  type: "extension_ui_request",
  method: "notify",
  notifyType: "warning",
  message:
    "Session has no marks or beats yet. Record entries with /chronicle:mark or /chronicle:beat first.",
};

describe("pi-sdk smoke contract response assertions", () => {
  it("accepts an actual-shaped feature notification and handled response", () => {
    const [result] = behaviorAssertions("happy_path", {
      records: [statusNotification, handledStatus],
    });

    assert.equal(result.id, "feature_response");
    assert.equal(result.passed, true);
  });

  it("rejects the feature response when the handled prompt response is missing", () => {
    const [result] = behaviorAssertions("happy_path", {
      records: [statusNotification],
    });

    assert.equal(result.passed, false);
  });

  it("accepts the handled empty-export warning only when no output files were created", () => {
    const [result] = behaviorAssertions("error_path", {
      records: [handledEmptyExport, emptyExportWarning],
      projectFiles: [],
    });

    assert.equal(result.id, "handled_error");
    assert.equal(result.passed, true);
  });

  it("rejects a missing handled response or missing-warning fixture", () => {
    const [result] = behaviorAssertions("error_path", {
      records: [emptyExportWarning],
      projectFiles: [],
    });

    assert.equal(result.passed, false);
  });

  it("rejects extension registration when the status response is missing", () => {
    const [result] = behaviorAssertions("extension_load", { records: [] });

    assert.equal(result.id, "extension_registered");
    assert.equal(result.passed, false);
  });

  it("rejects reload success when the second process has no handled feature response", () => {
    const [registered, feature] = behaviorAssertions("reload_cleanup", {
      first: { exit_code: 0 },
      second: {
        records: [status],
        exit_code: 0,
        hasUnhandledError: false,
        hasLoadError: false,
      },
    });

    assert.equal(registered.passed, true);
    assert.equal(feature.id, "reloaded_feature_response");
    assert.equal(feature.passed, false);
  });
});
