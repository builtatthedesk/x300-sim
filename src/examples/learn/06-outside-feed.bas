' A Raspberry Pi or ESP32 writes the outside temperature into extvar4 every
' 10 minutes over HTTP. Keep the heat off while it is warmer than extvar3
' outside, but only while the feed is fresh: if no new value arrives for an
' hour, fall back to a plain thermostat. The sender alternates the last digit
' (e.g. 58.00 / 57.95) so even a steady temperature looks like a new value.
' extvar0 = setpoint, extvar1 = swing, extvar3 = outside cut-off, extvar4 = outside.
do
  let c = temp1
  if extvar4 <> f then
    let f = extvar4
    let t1 = 36000
  end if
  let e = 1
  if t1 > 0 then
    if extvar4 > extvar3 then
      let e = 0
    end if
  end if
  if e = 0 then
    let relay1 = 0
  else
    let b = extvar0 - extvar1
    if relay1 = 0 then
      if c < b then
        let relay1 = 1
      end if
    else
      if c > extvar0 then
        let relay1 = 0
      end if
    end if
  end if
loop
end
