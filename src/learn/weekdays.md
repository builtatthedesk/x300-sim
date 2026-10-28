---
title: "4. Weekdays"
description: Working out the day of the week from the date variable.
---
An office only needs heat during working hours on working days. The X-300 doesn't give you the day of the week directly, but it gives you the date as a number, and the day of the week falls out of that with one line of arithmetic.

{% bas "learn/04-weekdays.bas" %}
{% play "learn/04-weekdays" %}

## The day of the week from `date`

`date` counts days. Day 0 was Thursday, 1 January 1970, so the count moves through the week in step: every 7 days it's Thursday again. The remainder operator `%` gives you where you are in the week:

| `(date + 3) % 7` | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |

Adding 3 first just shifts the numbering so that Monday is 0, which makes "Monday to Friday" the same as "less than 5".

Because X-300 scripts do one operation per line, the script does it in two steps:

```
let d = date + 3
let d = d % 7
```

<div class="note"><p><strong>About <code>%</code>.</strong> The X-300 manual only shows <code>+</code> and <code>-</code> in its examples. <code>%</code> (remainder) is documented for ControlByWeb's newer 400 series, and the scripts in the <a href="/case-study/">case study</a> use it on real X-300 units, which accept and run it. The <a href="/about/">about page</a> lists everything that's observed rather than documented.</p></div>

## Three conditions, nested

"Weekday, after 08:00, before 18:00" is three `IF`s, one inside the next. Nesting is limited to 5 levels on the X-300, so it's worth noticing how deep you are. Here the deepest point is 3 `IF`s inside the `DO`, 4 levels in total.

## Try it

1. The example starts on a Friday at 07:30. Run at **10 min/s** and watch the heat come on at 08:00 and switch to setback at 18:00.
2. Keep it running into Saturday: no occupied period at all.
3. Change the date to a Monday and watch the week start again.
