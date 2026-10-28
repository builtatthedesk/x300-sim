---
title: About
description: What this simulator is, what it isn't, what is still unknown, and the license.
---
This is an independent, unofficial project. It is not made, endorsed or supported by ControlByWeb or Xytronix Research & Design, Inc. ControlByWeb and X-300 are their trademarks, used here only to say what the simulator is for. For anything official, use [ControlByWeb's X-300 documentation](https://www.controlbyweb.com/x300/manuals.html) and support.

## Why it exists

It started as a way to change the heating script on a building's X-300 without guessing. Each new version was run here over simulated winter days, mild afternoons, weekends and power cuts before it went onto the unit. The [case study](/case-study/) is that story. It seemed worth tidying up so anyone with an X-300 could do the same.

The X-300 is now listed as a legacy product, and ControlByWeb points new customers to the X-410. Plenty of X-300s are still running, though, and a simulator helps get more out of them.

## How it works

The interpreter is a few hundred lines of JavaScript that runs entirely in your browser. It follows the BASIC rules in Appendix G of the X-300 users manual, written from that description rather than from any ControlByWeb code. The same interpreter runs this site's test suite: every lesson and case-study script on the site is checked against the behaviour its page describes on every build.

The room in the playground is a crude model: it gains heat while relay 1 is on and loses it toward the outside temperature. It exists to make a thermostat script switch, not to predict a real building.

<h2 id="known-unknowns">Known unknowns</h2>

Where the manual is silent, the simulator has to choose. These are the choices, and where real units were seen to differ from the manual:

| Question | Simulator | Basis |
|---|---|---|
| Is `%` (remainder) supported? | Yes | Observed: X-300s run scripts that use it |
| Are `*` and `/` supported? | Runs them, with a warning | Documented for the 400 series only |
| Are the unit's variable names case-sensitive? | No (`Relay1` = `relay1`) | Observed; the manual says variables are case-sensitive |
| How fast does the script run? | About 400 statements per simulated 10 s | Unknown; the real unit is much faster, which only matters for very tight timing |
| What does an unplugged sensor read as? | 0 | Unknown |
| Do external variables survive a power cut? | Yes, by default (switchable in the playground) | Unknown |
| What state are relays in after a power cut? | Off | Unknown |
| Are variables reset when the script restarts? | Yes | Unknown; the safe assumption |
| Number of external variables | 5 (`extvar0`–`extvar4`) | The manual says 4, 5 and 6 in different places; the unit's status page shows 5 |

If you have an X-300 and can settle any of these, please [open an issue](https://github.com/whateverdot/x300-sim/issues) with what you saw.

## License

The simulator code, the lessons and the example scripts are released under the MIT License. Copy them, change them, use them on your own units. The [source is on GitHub](https://github.com/whateverdot/x300-sim).

No warranty: a heating script controls real equipment. Test carefully and keep a way to roll back.
