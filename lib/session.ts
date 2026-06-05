/**
 * Chronicle session model — in-memory state for one work session.
 */

export interface ChronicleSession {
  name: string;
  project: {
    key: string;
    progressDir: string;
  };
  startedAt: Date;
  marks: Mark[];
  beats: Beat[];
}

export interface Mark {
  time: Date;
  label: string;
}

export interface Beat {
  time: Date;
  type: BeatType;
  label: string;
}

export const BEAT_TYPES = [
  "decision",
  "blocker",
  "milestone",
  "try",
  "revert",
] as const;

export type BeatType = (typeof BEAT_TYPES)[number];

export const BEAT_TYPE_LABELS: Record<BeatType, string> = {
  decision: "decision — 方針を決めた",
  blocker: "blocker — 止まった・外部依存",
  milestone: "milestone — 完了した区切り",
  try: "try — 試した（未確定）",
  revert: "revert — 戻した・やめた",
};

export const DISTILL_TYPES = [
  "flow",
  "textbook",
  "essay",
  "fiction",
] as const;

export type DistillType = (typeof DISTILL_TYPES)[number];
