' Relay 1 on from 07:00 to 19:00, off the rest of the day.
do
  if time >= 07:00:00 then
    if time < 19:00:00 then
      let relay1 = 1
    else
      let relay1 = 0
    end if
  else
    let relay1 = 0
  end if
loop
end
