' Heat (relay 1) comes on below setpoint minus swing, goes off above setpoint.
' extvar0 = setpoint, extvar1 = swing. Readings outside 20-150 are ignored.
do
  let c = temp1
  if c > 20 then
    if c < 150 then
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
  end if
loop
end
