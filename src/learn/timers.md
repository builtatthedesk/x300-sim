---
title: "5. Timers"
description: Using the X-300's countdown timers for short-cycle protection.
---
Boilers and furnaces don't like being switched on again seconds after they've switched off. A minimum off time protects them. The X-300 has six countdown timers that make this easy.

{% bas "learn/05-timers.bas" %}
{% play "learn/05-timers" %}

## How timers work

The timers are `t0` to `t5`. You set one to a number and it immediately starts counting down by one every tenth of a second, stopping at 0. So:

| value | time |
|---|---|
| 10 | 1 second |
| 600 | 1 minute |
| 3000 | 5 minutes |
| 36000 | 1 hour |

A timer is just a number you can read, so "has 5 minutes passed?" becomes "is `t0` back at 0?".

## The pattern

1. When the heat goes **off**, start the timer: `let t0 = 3000`.
2. Before turning it **on**, also require `t0 = 0`.

Nothing else changes. When the timer is still running, the script simply doesn't turn the heat on yet; a later pass through the loop will, once the timer reaches 0.

## Other uses

- **Maximum run time**: start a timer when the heat comes on, and force it off when the timer runs out.
- **"Has anything happened lately?"**: restart a timer every time something arrives, and treat the data as stale once the timer has run out. Lesson 6 uses exactly this.
- **Delays**: wait a few minutes after an event before reacting to it.

## Try it

1. Run at **1 min/s** with the outside at 5°. With a tiny swing (0.2) the room would cycle quickly; the log shows the heat never coming back on within 5 minutes of going off.
2. Change `3000` to `6000` (10 minutes), press **Check & run**, and watch the off periods on the chart get longer.
