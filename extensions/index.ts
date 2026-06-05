import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ChronicleSession } from "../lib/session.ts";

import {
  registerChronicleAutostart,
  registerChronicleStatus,
} from "./chronicle-core.ts";
import { registerChronicleMark } from "./chronicle-mark.ts";
import { registerChronicleBeat } from "./chronicle-beat.ts";
import { registerChronicleEnd } from "./chronicle-end.ts";
import { registerChronicleDistill } from "./chronicle-distill.ts";
import { registerChronicleNovel } from "./chronicle-novel.ts";

export default function (pi: ExtensionAPI): void {
  let session: ChronicleSession | undefined;

  const getSession = () => session;
  const setSession = (s: ChronicleSession | undefined) => {
    session = s;
    if (!s) {
      pi.events.emit("chronicle:cleared", undefined);
    }
  };

  registerChronicleAutostart(pi, getSession, setSession);
  registerChronicleStatus(pi, getSession);
  registerChronicleMark(pi, getSession);
  registerChronicleBeat(pi, getSession);
  registerChronicleEnd(pi, getSession, setSession);
  registerChronicleDistill(pi, getSession);
  registerChronicleNovel(pi, getSession);
}
