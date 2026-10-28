---
title: "7. Seasons"
description: The day of the year from the date variable, and an override switch on the control page.
---
A building on a heating schedule often shouldn't heat at all in summer, whatever the thermostat thinks. This script only allows heat from 1 October to 31 May, and adds an override for the odd cold week in June or September.

{% bas "learn/07-seasons.bas" %}
{% play "learn/07-seasons" %}

## The day of the year

Months have different lengths and leap years add a day, so "is it between June and September?" is easiest to answer from the **day of the year** (0 = 1 January). Getting there from `date` takes a few lines:

1. `date - 10957` counts days from 1 January 2000 instead of 1970.
2. `% 1461` gives the position inside a four-year cycle (365 × 3 + 366 = 1461 days). Each cycle starts with a leap year: 2000, 2004, … 2028.
3. In the leap year (the first 366 days of the cycle), days after 29 February are moved back by one so that 1 March is always day 59.
4. In the other three years, subtract the leap year and take `% 365`.

After that, 31 May is day 150 and 1 October is day 273, in every year. Summer is "day 151 to 272". (The four-year rule is right for every year from 2000 to 2099, which covers any X-300 still running.)

## A control-page switch as an input

The X-300 has three relays. If one isn't wired to anything, you can still show it on the control page and use its ON/OFF buttons as a **switch** that the script reads: `relay2 = 0` means "automatic", `relay2 = 1` means "allow heat anyway". Nothing clicks in the field because nothing is connected, but the state is there for the script to read. Give it a clear name on the unit's relay setup page.

## Try it

1. The example starts on 15 July. The room is below setpoint, but the heat stays off.
2. Press **ON** for the season override: the thermostat takes over.
3. Change the date to 30 September and then 1 October to see the boundary.

That's the end of the lessons. The [case study](/case-study/) shows these ideas combined in a script that ran a real building.
