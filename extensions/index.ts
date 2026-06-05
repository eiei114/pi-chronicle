import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";

import { registerChronicleStartStatus } from "./chronicle-core.ts";
import { registerChronicleMark } from "./chronicle-mark.ts";
import { registerChronicleBeat } from "./chronicle-beat.ts";
import { registerChronicleEnd } from "./chronicle-end.ts";
import { registerChronicleDistill } from "./chronicle-distill.ts";

export default function (pi: ExtensionAPI): void {
  // Shared mutable session state
  let session: ChronicleSession | undefined;

  const getSession = () => session;
  const setSession = (s: ChronicleSession | undefined) => {
    session = s;
  };

  registerChronicleStartStatus(pi, getSession, setSession);
  registerChronicleMark(pi, getSession);
  registerChronicleBeat(pi, getSession);
  registerChronicleEnd(pi, getSession, setSession);
  registerChronicleDistill(pi, getSession);
}
