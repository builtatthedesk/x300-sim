' Office hours: day setpoint 08:00-18:00 Monday to Friday, setback otherwise.
' date counts days from Thursday 1970-01-01, so (date + 3) % 7 is 0 on Monday.
' extvar0 = occupied setpoint, extvar1 = swing, extvar2 = setback.
do
  let c = temp1
  let d = date + 3
  let d = d % 7
  let a = extvar2
  if d < 5 then
    if time >= 08:00:00 then
      if time < 18:00:00 then
        let a = extvar0
      end if
    end if
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
