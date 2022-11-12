// Copyright 2022 James Bradlee. All rights reserved. MIT License.

import { Result } from "./Result.ts";

export interface Display {
  fmt(f: Deno.WriterSync): FmtResult;
}

export type FmtResult = Result<void, Error>;
