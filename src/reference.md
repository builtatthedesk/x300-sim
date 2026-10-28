---
title: Language reference
description: Every X-300 BASIC statement, variable and limit on one page, with what is documented, observed, or unknown.
---
A summary in this site's own words. The official source is Appendix G, "BASIC Scripts", of the [X-300 users manual](https://www.controlbyweb.com/x300/x-300_users_manual.pdf) (version 1.8). Each entry is marked:

- **Documented**: stated in the manual.
- **Observed**: not in the manual, but real X-300s accept it.
- **Simulator choice**: the manual is silent; this is what the simulator does. See [About](/about/#known-unknowns).

## Layout of a script

- One statement per line. Blank lines are fine. *(Documented)*
- Every word, number and operator is separated by spaces: `let a = b + 1`, never `let a=b+1`. *(Documented)*
- `'` starts a comment, to the end of the line. `REM` at the start of a line does the same. *(Documented)*
- Statement words (`LET`, `IF`, …) can be any case. *(Documented)* The manual says variable names are case-sensitive, but real units accept the unit's own names in any case (`relay1`, `Relay1`). *(Observed)* Your variables `a`–`j` must be lower case. *(Documented)*
- The main program ends with `END`. Subroutines, if any, come after it. *(Documented)*
- End the file with a blank line after `END` (or after the last `END SUB`). *(Documented)*
- The whole script must fit in 1,900 bytes. A longer script gets cut off, which usually shows up as a "missing end of line" error. *(Documented)* The manual counts a line ending as one byte; files saved on Windows have two (CR LF), so the simulator counts two per line to be safe. *(Simulator choice)*

## Statements

| Statement | What it does |
|---|---|
| `LET var = value` | Store a value. The right side is one value, or two values with one operator. |
| `IF value op value THEN` … `ELSE` … `END IF` | Run a block if the condition holds. `THEN` ends the line (the manual marks it optional, and the simulator warns if it's missing); one `ELSE` at most, on its own line; `END IF` is required. |
| `DO` … `LOOP` | Repeat forever. |
| `DO WHILE value op value` … `LOOP` | Repeat while the condition holds. With no condition it repeats forever, like `DO`. |
| `FOR var = value TO value` … `NEXT var` | Count `var` up by 1 from the first value to the second, inclusive. *(No `STEP` is documented.)* |
| `CALL name` / `SUB name` … `END SUB` | Run a subroutine and come back. Names are case-sensitive, up to 20 characters. |
| `LOG` | Write a log entry, if logging is turned on in the unit's setup. |
| `EMAIL` | Send the general email. `EMAIL relay1` / `EMAIL temp1` / `EMAIL input1` send that item's message. |
| `END` | Stop the main program. |

`PRINT` only works in the vendor's PC syntax checker, not on the unit, so the simulator rejects it. There is no `GOTO`, `AND`, `OR` or `NOT`; use nested `IF`s and flag variables.

## Conditions

`IF`, `DO WHILE`: one value on the left, a comparison, then a value or a one-operator sum on the right. `if c <= b - h then` is fine; `if c + 1 > b then` is not (put `c + 1` in a variable first). *(Documented)*

Comparisons: `=`, `<>`, `<`, `>`, `<=`, `>=`.

## Arithmetic

One operation per line. *(The manual's examples only ever do one; the vendor's newer 400 series documents this rule explicitly.)*

| Operator | Status |
|---|---|
| `+`, `-` | Documented |
| `%` (remainder) | Observed on real X-300s; documented for the 400 series |
| `*`, `/` | Documented for the 400 series only. The simulator runs them but warns. |

Negative numbers are written with no space: `-3`.

<h2 id="variables">Variables</h2>

<span id="relays"></span>

| Name | Read | Write | Notes |
|---|---|---|---|
| `a` … `j` | yes | yes | Your ten variables. Numbers with decimals. |
| `relay1` … `relay3` | 0 or 1 | 0 off, 1 on, 2 pulse, 5 toggle | A pulse turns the relay on for the pulse time set on the relay setup page, then off. The simulator uses 1 second. |
| `rmt_relay1` … `rmt_relay3` | no | yes | Controls a relay on another unit, set up on the relay page. Can't be read back. |
| `temp1` … `temp8` | yes | no | Temperature (or humidity, for a humidity sensor) in the unit's chosen units. |
| `extvar0` … `extvar4` | yes | yes | External variables: also settable from the control page or over HTTP. |
| `t0` … `t5` | yes | yes | Timers: count down by 1 every 0.1 s, stop at 0. Set them to 0 or a positive whole number. |
| `time` | yes | no | Seconds since midnight. Compare with `hh:mm:ss`. |
| `date` | yes | no | Days since 1 January 1970. Compare with `mm/dd/yyyy`. |
| `ed1` … `ed5`, `et1` … `et5` | yes | yes | Event date (days) and time (seconds) pairs. Adding past midnight to an `et` rolls its `ed` forward a day. |

The manual isn't consistent about how many external variables there are: different pages show different ranges, one going up to `extvar5`. The unit's status page lists `extvar0` to `extvar4`, so the simulator provides five.

## Values you can write

- Numbers: `70`, `0.5`, `-3`. Write `0.5`, not `.5`.
- Times: `07:30:00` (seconds since midnight).
- Dates: `12/25/2026` (days since 1970).

## From outside the script

- External variables can be set with a web request to the unit's `state.xml` page, e.g. `state.xml?extvar1=68.5`.
- Relays can be switched the same way. Note that over HTTP "toggle" is **3**, while in a script it's **5**.
- Control-page buttons can be set up to write 1 or 0 to an external variable.

## Limits

| Limit | Value |
|---|---|
| Script size | 1,900 bytes, counting line endings as 2 bytes |
| Nesting of `IF`/`DO`/`FOR` | 5 deep (the simulator warns past 5; see below) |
| User variables | 10 (`a`–`j`) |
| Timers | 6 |
| Subroutine name | 20 characters |

On nesting, the manual says `IF`, `FOR` and `DO` can each be nested five times, without saying whether a mix of them counts together. The simulator counts them together and warns, rather than refusing, past five. Staying within five in total is safe either way.
