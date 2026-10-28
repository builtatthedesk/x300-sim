---
title: "1. A time schedule"
description: The loop every X-300 script lives in, the time variable, and switching a relay.
---
The simplest useful script switches relay 1 on at 07:00 and off at 19:00, every day. It already shows the shape every X-300 script has.

{% bas "learn/01-schedule.bas" %}
{% play "learn/01-schedule" %}

## The loop

A script starts at the top when the unit powers up (or when you change a setting), and runs down the lines. If it reaches `END`, it stops for good, so almost every script wraps its work in a loop that never ends:

```
do
  ' ... check things and set relays ...
loop
end
```

`DO` with nothing after it repeats forever. The unit runs through the loop over and over, so the script is always reacting to the current time and temperatures. `END` still has to be there: the unit refuses a script without it.

## Reading the clock

`time` is the unit's clock, as seconds since midnight. You can compare it with a time written as `hh:mm:ss`, so `time >= 07:00:00` is true from seven in the morning until midnight.

There is no `AND` in X-300 BASIC, so "between 07:00 and 19:00" is written as one `IF` inside another: first check it's 07:00 or later, then, inside that, check it's before 19:00.

## Setting a relay

`let relay1 = 1` closes relay 1 and `let relay1 = 0` opens it. Setting a relay to the value it already has does nothing, so it's fine to set it on every pass through the loop. (You can also write `2` to pulse a relay and `5` to toggle it; see the [reference](/reference/#relays).)

## Small rules this already uses

- One statement per line.
- Spaces around every operator: `time >= 07:00:00`, never `time>=07:00:00`.
- `IF` ends with `THEN` on the same line, the body starts on the next line, and every `IF` needs an `END IF`.
- Text after `'` is a comment.

## Try it

1. Open it in the playground and set the clock speed to **10 min/s**.
2. Watch relay 1 come on at 07:00 and go off at 19:00. The log shows the line that changed it.
3. Change `19:00:00` to `17:30:00`, press **Check & run**, and watch it switch earlier.
4. Delete the space in `time >= 07:00:00` and run it again to see the error the unit would give you.
