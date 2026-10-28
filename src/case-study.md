---
title: "Case study: one heating script, four versions"
description: How a real X-300 heating script grew from a plain thermostat to weekdays, outside temperature and seasons, without outgrowing a 1900-byte limit.
permalink: /case-study/
---
These four scripts ran, one after another, on an X-300 heating the ground floor of a small residential building. Each change was tested in this simulator before it was uploaded. They're shown here as they ran, apart from the building's name. Each version opens in the playground with sensible starting values.

The building's needs were ordinary: a comfortable day temperature, less at night, less during weekday working hours, no heating on mild afternoons, and none in summer.

## Version 1: a thermostat with a night setback

{% bas "case-study/v1-thermostat.bas" %}
{% play "case-study/v1" %}

The original. Day setpoint `extvar0`, night setpoint `extvar2` from 22:00 to 03:30, swing `extvar1`. Times are written as raw seconds since midnight (`12600` is 03:30, `79200` is 22:00), which works but is hard to read; `03:30:00` and `22:00:00` mean the same thing.

The `do while a = 1` loop is a common way to write a loop that never ends (`a` is set to 1 and never changed); a plain `DO` does the same.

Two quirks worth noticing: the sensor sanity check (`c > 20`, `c < 150`) is on separate lines at odd indentation, and `Let` and `Relay1` are capitalised on a couple of lines. Both run fine; the unit treats statement words and its own variable names without regard to case.

## Version 2: a weekday temperature

{% bas "case-study/v2-weekday.bas" %}
{% play "case-study/v2" %}

Two additions:

- **Weekday daytime setpoint.** From 08:00 to 16:00, Monday to Friday, the target drops to `extvar1`. The day of the week comes from `(date + 3) % 7`, as in [lesson 4](/learn/weekdays/). Setting `extvar1` to 49 or below switches the feature off without touching the script (`if extvar1 > 49 then`), which is handy for the odd week when the usual schedule doesn't apply.
- **Anticipation moved to `extvar3` and protected.** The swing (here called anticipation) is clamped: anything below 0.3 or above 5 is treated as 0.3. A slip on the control page (typing 30 instead of 3.0) can't make the heat cycle wildly.

The night window moved to the end of the "pick the target" section, so night always wins over the weekday rule.

## Version 3: no heat on mild afternoons

{% bas "case-study/v3-outdoor.bas" %}
{% play "case-study/v3" %}

A Raspberry Pi on the same network fetches the outside temperature and writes it into `extvar4` every 10 minutes, alternating the last digit so every push is a new value ([lesson 6](/learn/outside-feed/)). The script adds:

- `d`: 1 during the night window. The outside rule never applies at night; the building always heats to the night setpoint.
- `e`: 0 means "heat must be off". During the day, while the reading is fresh (`t1 > 0`) and above 55°, `e` goes to 0 and relay 1 is forced off.
- If the Pi stops sending for an hour, `t1` runs out and the script is exactly version 2 again.

The simulator's tests run versions 2 and 3 over the same days and check that they behave identically whenever the feed is missing.

## Version 4: a heating season and a test button

{% bas "case-study/v4-season.bas" %}
{% play "case-study/v4" %}

Two of the unit's three relays weren't wired to anything, so they became switches on the control page:

- **Relay 2, "Season ON".** From June to September the heat is off, unless this is switched on. The day of the year is worked out as in [lesson 7](/learn/seasons/). In season the switch does nothing.
- **Relay 3, "Test heat".** Pressing it forces the heat on for at most 30 minutes (`t2 = 18000`) or until the room passes 80°, then the script switches relay 3 back off itself. `t3` just remembers that the 30-minute timer has already been started for this press, so it isn't restarted on every pass. It's for checking from a distance that the boiler actually fires, without changing any setpoints.

`e = 2` is a third state, "force on", checked after the season and outside rules so that Test heat beats both.

The whole script is 1,629 bytes on disk and 1,732 as the unit counts them (each line ending counts as two bytes), under the 1,900-byte limit. All four versions touch the nesting limit of 5 in places (the loop plus four `IF`s), which is one reason v4 uses the flags `d`, `e` and `g` instead of nesting the rules inside each other.

## What carried through all four versions

- **Decide, then act.** Every version first works out a target (`b`) and whether heat is allowed (`e`), then runs the same short thermostat block. New rules only touch the first half.
- **Every input has a safe fallback.** A bad sensor reading, a silly control-page value, a dead weather feed: each one falls back to plain thermostat behaviour instead of leaving the heat on or off forever.
- **Test before upload.** Every version was run in this simulator over winter days, warm days, weekends, a dead feed and power cuts before it went near the unit. The current one was then uploaded, checked to say "Running", and tested once with the Test heat button.
