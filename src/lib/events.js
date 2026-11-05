import { callEndpoint } from "./tg.js";
export function logEvent(name, meta = null) {
  callEndpoint("logEvent", meta ? { name, meta } : { name }, {
    timeoutMs: 5e3,
  }).catch(() => {});
}
