import type { StoreState } from "./state";
import { createInitialState } from "./seed";
import { initCounter } from "./helpers/id";

let state: StoreState = createInitialState();

initCounter("EVT", 3);
initCounter("DATE", 6);
initCounter("TCK", 9);
initCounter("DSC", 3);
initCounter("ORD", 8);
initCounter("BUY", 5);
initCounter("AUD", 0);

export function getState(): StoreState {
  return state;
}

export function resetState(): void {
  state = createInitialState();
  initCounter("EVT", 3);
  initCounter("DATE", 6);
  initCounter("TCK", 9);
  initCounter("DSC", 3);
  initCounter("ORD", 8);
  initCounter("BUY", 5);
  initCounter("AUD", 0);
}

export { generateId } from "./helpers/id";
export * from "./state";
export * from "./repositories";
