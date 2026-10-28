' Heating season only: October 1 to May 31. Relay 2 is an override switch
' on the control page that allows heat in summer too.
' Day of year (0 = January 1) from date, leap years included:
'   days since 2000-01-01 (date 10957), within its 4-year cycle (1461 days).
' extvar0 = setpoint, extvar1 = swing.
do
  let c = temp1
  let i = date - 10957
  let i = i % 1461
  if i < 366 then
    if i > 59 then
      let i = i - 1
    end if
  else
    let i = i - 366
    let i = i % 365
  end if
  let e = 1
  if i > 150 then
    if i < 273 then
      if relay2 = 0 then
        let e = 0
      end if
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
