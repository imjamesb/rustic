import type { Option } from "./Option.ts";
import type { Display } from "./Display.ts";

export interface Rerror extends Display {
  source(): Option<Rerror>;
  stack(): Option<string>;
}
