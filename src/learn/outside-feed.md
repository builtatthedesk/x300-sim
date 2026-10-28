---
title: "6. Data from outside"
description: Letting another device push a value into the X-300, and not trusting it once it goes quiet.
---
The X-300 can't fetch the weather, but anything on the network can **send** it a value. A Raspberry Pi, an ESP32 or a home-automation server can write the outside temperature into an external variable every few minutes. This script keeps the heat off while it's mild outside, and stops trusting the value if the sender goes quiet.

{% bas "learn/06-outside-feed.bas" %}
{% play "learn/06-outside-feed" %}

## Sending a value in

External variables can be set with a plain web request to the unit, as described in the manual's section on its `state.xml` page. Something like this, sent every 10 minutes from a small script or an automation, is enough:

```
http://<unit address>/state.xml?extvar4=57.95
```

If the unit has a control password set, the request has to log in like a browser would. Don't expose the unit to the internet to do this; send from a device on the same network.

## Is the value fresh?

A feed can stop: the Pi crashes, the Wi-Fi drops, the weather service changes. If the script keeps believing the last number it got, a mild reading from yesterday afternoon could keep the heat off through a freezing night. So the script tracks **when** the value last changed:

```
if extvar4 <> f then     ' a different value than last time?
  let f = extvar4        ' remember it
  let t1 = 36000         ' and restart a one-hour timer
end if
```

While `t1` is still counting, the reading is fresh and the outside rule applies. Once it reaches 0 with no new value, the script behaves like a plain thermostat again.

## The alternating last digit

There's one catch: if it's 58° outside for three hours, every push is the same number, so `extvar4 <> f` never sees a change and the timer runs out even though the feed is fine. The fix is on the sending side: alternate the last digit, sending 58.00, then 57.95, then 58.00. The 0.05° makes no practical difference, but every push now looks new. The playground's sender does this.

## Try it

1. The example starts at 58° outside with the cut-off at 55°. The heat stays off even though the room is below setpoint.
2. Drag **Outside** below 55 and wait for the next push (up to 10 simulated minutes): the thermostat takes over.
3. Untick the sender, run at **10 min/s**, and watch the heat come back an hour after the last value arrived.
