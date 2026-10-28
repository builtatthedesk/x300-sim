---
title: "2. A thermostat"
description: Reading a temperature sensor and switching heat with a setpoint and a swing.
---
A thermostat turns the heat on when the room is too cold and off when it's warm enough. Written naively, "on below 70, off above 70", it would flick the relay on and off every few seconds around 70. Real thermostats use two thresholds, and so does this script.

{% bas "learn/02-thermostat.bas" %}
{% play "learn/02-thermostat" %}

## Two thresholds: setpoint and swing

- `extvar0` is the **setpoint**: the heat turns **off** once the room is above it.
- `extvar1` is the **swing**: the heat turns back **on** only when the room drops below setpoint minus swing.

With a setpoint of 70 and a swing of 1, the heat comes on below 69 and goes off above 70. The gap between the two is what stops the relay chattering.

The script decides which threshold to check by looking at the relay itself: while the heat is off (`relay1 = 0`) it waits for the lower one; while it's on, it waits for the upper one.

## Sensors and user variables

`temp1` is the reading from sensor 1, in whatever units the unit is set to (°F here). The script copies it into `c` once per pass so every check in that pass uses the same reading.

Your own variables are the ten single letters `a` to `j`, lower case. That's all there is, so it pays to keep a note of what each letter means. They all start at 0, and go back to 0 whenever the script restarts (after a power cut or saving a setup page).

In a `LET`, `=` stores a value; in an `IF`, `=` compares. `if relay1 = 0 then` asks "is relay 1 off?"

`let b = extvar0 - extvar1` does one subtraction. X-300 scripts do **one operation per line**: `let b = extvar0 - extvar1 - 1` would be an error, so split longer sums across lines.

## Setpoints from the control page

`extvar0` to `extvar4` are external variables. They're numbers the script can read, but they can be changed from the unit's control page (or by another device over the network) without touching the script. That makes them the natural place for anything a person might want to adjust, like a setpoint.

## A sanity check

The outer two `IF`s skip everything unless the reading is between 20 and 150. If a sensor is unplugged or faulty, its reading can be nonsense, and a thermostat that believes the room is −40° will run the heat forever. Ignoring impossible readings is cheap insurance.

## Try it

1. Run it at **10 min/s** with the outside slider at 25°. The chart shows the room climbing, then holding between 69 and 70.
2. Change `extvar1` on the control page to 3 and watch the cycles get longer and the temperature range wider.
3. Drag the **Inside** slider down to 50 and back: the relay follows.
