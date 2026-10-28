' Short-cycle protection: once the heat goes off it stays off for at least
' 5 minutes. Timers count down in tenths of a second, so 3000 = 5 minutes.
' extvar0 = setpoint, extvar1 = swing.
do
  let c = temp1
  let b = extvar0 - extvar1
  if relay1 = 0 then
    if c < b then
      if t0 = 0 then
        let relay1 = 1
      end if
    end if
  else
    if c > extvar0 then
      let relay1 = 0
      let t0 = 3000
    end if
  end if
loop
end
