---
title: Rules and checklist
description: The X-300 BASIC rules that trip people up, and a checklist for every upload.
---
## The rules that cause most errors

1. **Spaces around everything.** `let a = b + 1`. Leaving out a single space (`b+1`, `a>1`) is an error.
2. **One operation per line.** `let a = b + c` is fine; `let a = b + c - 1` isn't. Use a spare variable for the middle step.
3. **One value on the left of a comparison.** `if a > b + 1 then` is fine; `if a - 1 > b then` isn't.
4. **`THEN` at the end of the `IF` line, body on the next line, `END IF` always.** `ELSE`, `LOOP`, `NEXT` and `END IF` each go on a line by themselves.
5. **Your variables are `a` to `j`, lower case.** There are no others and no named variables.
6. **No `AND` / `OR`.** Nest `IF`s, or set a flag variable in several `IF`s and test the flag once.
7. **Keep nesting to 5 levels in total.** The main `DO` loop counts as one. The manual's wording leaves room for a little more, but 5 in total is safe. Flag variables keep nesting shallow.
8. **1,900 bytes, line endings included.** Indentation and comments count too. Over the limit, the end of the script is silently lost.
9. **`END` before any subroutines.**
10. **Errors can hide.** The unit reports an error when it reaches the bad line. A typo inside an `IF` that hasn't been true yet won't show up until it is. The simulator and the vendor's checker both check every line up front, which is one reason to use them.

<h2 id="before-every-upload">Before every upload</h2>

1. **Save what's on the unit now.** Copy the script from the unit's Script tab into a dated text file. That's your rollback.
2. **Run it here.** Check that it passes, then run the days that matter: a cold day, a mild day, a weekday and a weekend, midnight, and a power cut.
3. **Run the vendor's checker.** ControlByWeb provides a Windows command-line BASIC checker (`cbw_basic`, linked from their [BASIC script tutorial](https://controlbyweb.com/support/basic-script-tutorial/)). It is the authority on syntax. Note that after "syntax check passed" it starts running the script and doesn't stop on its own.
4. **Upload under a new file name** and make sure the script is set to run.
5. **Check the status.** The Script tab should report the script running. If it reports an error, it names the line.
6. **Test one thing live.** Press a button, change a setpoint, or wait for a time boundary, and watch the relay do what you expected.
7. **Keep notes.** What changed, when, and how to roll back.

## Things the unit does that surprise people

- **Saving any setup page restarts the script.** So does a power cut. Your variables `a`–`j` and the timers start again from scratch. Write scripts that work out everything from the current time, sensors and external variables on each pass, rather than remembering state for long.
- **Relays after a power cut.** The manual doesn't say what state relays come back in. Don't rely on a relay staying on through a power cut.
- **External variables after a power cut.** Also not documented. Values given on the setup page are the safe assumption; a value pushed in over the network may need pushing again.
