' Thermostat with a night setback.
' extvar0 = day setpoint, extvar1 = swing, extvar2 = night setpoint (22:00-06:00).
do
  let c = temp1
  let a = extvar0
  if time >= 22:00:00 then
    let a = extvar2
  end if
  if time < 06:00:00 then
    let a = extvar2
  end if
  let b = a - extvar1
  if relay1 = 0 then
    if c < b then
      let relay1 = 1
    end if
  else
    if c > a then
      let relay1 = 0
    end if
  end if
loop
end
