---
title: Change your unit's script safely
description: "The quick path for changing the script already running on your X-300: back it up, test the change here, upload it, check it."
permalink: /your-script/
---
You have an X-300 that already runs a script, and you want to change something: a time, a setpoint, a new rule. This is the short version of the [checklist](/rules/#before-every-upload), start to finish.

## 1. Save what's on the unit now

Log in to the unit's setup pages and open the **Script** tab. Copy the whole script into a text file and save it with today's date in the name. If anything goes wrong later, uploading this file puts things back exactly as they were.

## 2. Paste it into the playground

Open the [playground](/playground/) and paste your script over the example. It's kept in your browser as **My script**, so trying an example won't lose it. Press **Check & run**.

If it reports an error on a script that runs fine on the unit, the simulator is wrong, not your script. Please [report it](https://github.com/whateverdot/x300-sim/issues) with the line it complained about.

## 3. Set up the world your script expects

- Fill in the external variables (`extvar0`…) with the values on your unit's control page.
- Set the date and time, and the inside and outside temperatures.
- If another device sends values into an external variable, tick the outside sender box (it writes the outside temperature to the variable your script reads).

Then run the clock at **10 min/s** and check that the relays do what the unit does today. If they don't, sort that out before changing anything: it means the simulation isn't set up like your unit yet.

## 4. Make the change and try the days that matter

Edit the script, press **Check & run**, and run through:

- a cold day and a mild day,
- a weekday and a weekend,
- midnight,
- a power cut (the **Simulate a power cut** button).

Watch the chart and the log. Every relay change in the log says which line caused it.

## 5. Download and upload

Press **Download .txt for the unit**. The file has the line endings the unit expects and the blank last line the manual asks for. Run it through ControlByWeb's own checker if you have it, then upload it on the unit's Script tab and make sure the script is set to run.

## 6. Check it on the unit

The Script tab should say the script is running. If it shows an error, it names the line: fix that line here and upload again, or upload yesterday's file to put things back. Then test one thing for real: press a button, or wait for a time boundary, and watch the relay.
