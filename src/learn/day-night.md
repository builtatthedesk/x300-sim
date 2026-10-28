---
title: "3. Day and night"
description: Choosing a different setpoint at night.
---
Most buildings don't need to be as warm at night. This script uses a lower setpoint from 22:00 to 06:00.

{% bas "learn/03-day-night.bas" %}
{% play "learn/03-day-night" %}

## Pick the target first, then act on it

Instead of two copies of the thermostat logic, the script first decides **which** setpoint applies right now and puts it in `a`. The thermostat part after that is the same as in lesson 2, just using `a` instead of `extvar0`. (The sensor sanity check from lesson 2 is left out of this and the later lessons to keep them short. Keep it in a real script.)

```
let a = extvar0          ' assume daytime
if time >= 22:00:00 then
  let a = extvar2        ' late evening
end if
if time < 06:00:00 then
  let a = extvar2        ' early morning
end if
```

The night window crosses midnight, so it's really two windows, "after 22:00" and "before 06:00". Two separate `IF`s handle that without needing an `OR` (X-300 BASIC doesn't have one).

## Why this pattern scales

Lesson 4 adds a rule by changing how `a` is chosen; lessons 6 and 7 add a rule that can force the heat off. Either way the bottom of the script stays the same. Keeping "decide" and "act" apart keeps a script readable as it grows, and makes it easy to find the line responsible when the heat does something surprising.

## Try it

1. The example starts at 21:00. Run at **1 min/s** and watch the setpoint switch at 22:00: the heat stops and the room drifts down toward 62.
2. Move the clock slider to 05:50 and watch it warm back up after 06:00.
3. Change the night window to start at 23:30.
