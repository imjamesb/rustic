import { Err, Ok, type Result } from "./Result.ts";
import { sprintf } from "./_/printf.ts";

const e = new TextEncoder();

/**
 * Format converts and formats a variable number of arguments as is specified
 * by a `format string`. In it's basic form, a format string may just be a
 * literal. In case arguments are meant to be formatted, a `directive` is
 * containedin the format string, preceded by a '%' character:
 *
 * ```txt
 * %<verb>
 * ```
 *
 * E.g.the verb `s` indicates the directive should be replaced by the string
 * representation of the argument in the corresponding position of the argument
 * list. Eg.:
 *
 * ```txt
 * Hello, %s!
 * ```
 *
 * applied to the arguments "World" yields "Hello, World!".
 *
 * The meaning of the format string is modelled after
 * [POSIX](https://pubs.opengroup.org/onlinepubs/009695399/functions/fprintf.html)
 * format strings as well as [Golang format
 * strings](https://golang.org/pkg/fmt/). Both contain elements specific to the
 * respective programming language that don't apply to JavaScript, so they can
 * not be fully supported. Furthermore we implement some functionality that is
 * specific to JS.
 *
 * ## Verbs
 *
 * The following verbs are supported:
 * | Verb  | Meaning                                                                          |
 * | :---- | :------------------------------------------------------------------------------- |
 * | `%`   | Print a literal percent                                                          |
 * | `t`   | Evaluate arg as boolean, print `true` or `false`.                                |
 * | `b`   | Evaluate arg as number, print binary.                                            |
 * | `c`   | Evaluate arg as number, print character corresponding to the codePoint.          |
 * | `o`   | Evaluate arg as number, print octal.                                             |
 * | `x X` | Evaluate arg as string, print as HEX (`ff` `FF`). Treat string as list of bytes. |
 * | `e E` | Print number in scientific/exponent format. E.g. `1.123123e+01`.                 |
 * | `f F` | Print number as float with decimal point and no exponent.                        |
 * | `g G` | Same as `%e %E` or `%f %F` depending on the size of the argument.                |
 * | `s`   | Interpolate string.                                                              |
 * | `T`   | Show the type of the argument, as returned by `typeof`.                          |
 * | `v`   | Value of argument in 'default' format (see below).                               |
 * | `j J` | Argument as formatted by `JSON.stringify`. `j` compact and `J` as expanded.      |
 * | `i I` | Argument as formatted by `Deno.inspect`. `i` compact and `I` as expanded.        |
 * | `?`   | Argument as formatted by `<Display>.fmt()`.                                      |
 *
 * ## Width and Precision
 *
 * Verbs may be modified by providing them them with width and precision,
 * either or both may be omitted.
 *
 * ```txt
 * %9f    width 9         default precision
 * %.9f   default width   precision 9
 * %8.9   width 9         precision 9
 * %8.f   width 9         precision 0
 * ```
 *
 * In general, 'width' describes the minimum length of the output, while
 * 'precision' limits the output.
 *
 * | Verb      | Precision                                                          |
 * | :-------- | :----------------------------------------------------------------- |
 * | `t`       | n/a                                                                |
 * | `b c o`   | n/a                                                                |
 * | `x X`     | n/a for number, strings are truncated to p bytes(!)                |
 * | `e E f F` | Number of places after decimal, defaults to `6`.                   |
 * | `g G`     | Set maximum number of digits.                                      |
 * | `s`       | Truncate input                                                     |
 * | `T`       | Truncate                                                           |
 * | `v`       | Truncate, or depth if used with `#` see "'default' format", below. |
 * | `j J i I` | n/a                                                                |
 *
 * Numerical values for width and precision can be substituded for the `*`
 * character, in which case the values are obtained from the next args, e.g.:
 *
 * ```ts
 * import { format } from "./mod.ts"
 * format("%*.*f", 9, 8, 456.0)
 * ```
 *
 * ... is equivalent to:
 *
 * ```ts
 * import { format } from "./mod.ts"
 * format("%9.8f", 456.0)
 * ```
 *
 * ## Flags
 *
 * The effects of the verb may be further incluenced by using flags to modify
 * the directive:
 *
 * | Flag  | Verb      | Meaning                                                                     |
 * | :---- | :-------- | :-------------------------------------------------------------------------- |
 * | `+`   | numeric   | Always print sign.                                                          |
 * | `-`   | all       | Pad to the right (left justify).                                            |
 * | `#`   |           | Alternate format.                                                           |
 * | `#`   | `b o x X` | Prefix with `0b 0 0x`.                                                      |
 * | `#`   | `g G`     | Don't remove trailing zeroes.                                               |
 * | `#`   | `v`       | Uses output of `inspect` instead of `toString`.                             |
 * | `' '` |           | Space character.                                                            |
 * | `' '` | `x X`     | Leave spaces between bytes when printing string.                            |
 * | `' '` | `d`       | Insert space for missing `+` sign character.                                |
 * | `0`   | all       | Pad with zero, `-` takes precedence, sign is appended in front of padding.  |
 * | `<`   | all       | Format elements of the passed array according to the directive (extension). |
 *
 * ## 'default' value
 *
 * The default format used by `%v` is the result of calling `toString()` on the
 * relevant argument. If the `#` flags is used, the result of calling
 * `inspect()` is interpolated. In this case, the precision, if set is passed
 * to `inspect()` as the 'depth' config parameter.
 *
 * ## Positional arguments
 *
 * Arguments do not need to be consumed in the order they are provided and may
 * be consumed more than once. E.g.:
 *
 * ```ts
 * import { format } from "./mod.ts"
 * format("%[2]s %[1]s", "World", "Hello")
 * ```
 *
 * ... returns "Hello World". The presence of a positional indicator resets the
 * arg counter allowing args to be reused:
 *
 * ```ts
 * import { format } from "./mod.ts"
 * format("dec[%d]=%d hex[%[1]d]=%x oct[%[1]d]=%#o %s", 1, 255, "Third")
 * ```
 *
 * ... returns `dec[1]=255 hex[1]=0xff oct[1]=0377 Third`.
 *
 * Width and precision may also use positionals:
 *
 * ```txt
 * "%[2]*.[1]*d", 1, 2
 * ```
 *
 * This follows the goland conventions and not POSIX.
 *
 * ## Errors
 *
 * The following errors are handled:
 *
 * Incorrect verb:
 *
 * ```txt
 * S("%h", "") %!(BAD VERB 'h')
 * ```
 *
 * Too few arguments:
 *
 * ```txt
 * S("%d") %!(MISSING 'd')"
 * ```
 *
 * @param formatter The formatter string.
 * @param args The arguments to use in the formatter.
 * @returns The formatted string.
 */
export function format(formatter: string, ...args: unknown[]) {
  return sprintf(formatter, ...args);
}

export function write(
  stream: Deno.WriterSync,
  formatter: string,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
): Result<void, Error> {
  try {
    stream.writeSync(e.encode(format(formatter, ...args)));
    return Ok();
  } catch (error) {
    return Err(error);
  }
}
