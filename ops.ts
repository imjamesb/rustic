import { Err, Ok, type Result } from "./Result.ts";
import { sprintf } from "./_/printf.ts";

const e = new TextEncoder();

export function write(
  stream: Deno.WriterSync,
  formatter: string,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
): Result<void, Error> {
  try {
    stream.writeSync(e.encode(sprintf(formatter, ...args)));
    return Ok();
  } catch (error) {
    return Err(error);
  }
}
