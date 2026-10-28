---
title: Learn X-300 scripting
description: Seven short lessons that build an X-300 heating script from a time schedule up to seasons.
---
Each lesson adds one idea. Lessons 1–4 build one script up step by step; lessons 5–7 start again from the plain thermostat so each new idea stands alone, and the [case study](/case-study/) shows them all combined. Every lesson's script is a real file that this site's test suite runs, so what a page says the script does is what the simulator does.

1. [A time schedule](/learn/schedule/): the loop every script lives in, `time`, and turning a relay on and off.
2. [A thermostat](/learn/thermostat/): reading a sensor, a setpoint and a swing, and why a thermostat needs two thresholds.
3. [Day and night](/learn/day-night/): choosing a setpoint by time of day.
4. [Weekdays](/learn/weekdays/): working out the day of the week from `date`.
5. [Timers](/learn/timers/): keeping the heat off for at least five minutes once it goes off.
6. [Data from outside](/learn/outside-feed/): letting another device push the outside temperature in, and not trusting it once it goes quiet.
7. [Seasons](/learn/seasons/): the day of the year from `date`, and an override switch on the control page.

## Before you start

- **What the unit is.** The X-300 is a network temperature controller with three relays and inputs for up to eight temperature sensors. You set it up through its own web pages; a script runs on the unit itself.
- **Where scripts go.** On the unit's setup pages there is a Script tab where you upload a text file and tell it to run. The manual's BASIC appendix (Appendix G of the [X-300 users manual](https://www.controlbyweb.com/x300/x-300_users_manual.pdf)) is the official description of the language.
- **How to read the lessons.** Each one shows the whole script, explains what each part does, and ends with something to try in the playground.

The [reference](/reference/) lists every statement and variable in one place, and [Rules & checklist](/rules/) collects the limits.
