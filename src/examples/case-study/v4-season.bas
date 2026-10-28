let a = 1
do while a = 1
  let c = temp1
  let i = date + 3
  let j = i % 7
  let h = extvar3
  if h < 0.3 then
    let h = 0.3
  end if
  if h > 5 then
    let h = 0.3
  end if
  if extvar4 <> f then
    let f = extvar4
    let t1 = 36000
  end if
  let d = 0
  let b = extvar0
  if j < 5 then
    if time > 28799 then
      if time < 57600 then
        if extvar1 > 49 then
          let b = extvar1
        end if
      end if
    end if
  end if
  if time < 12600 then
    let d = 1
  end if
  if time > 79200 then
    let d = 1
  end if
  if d = 1 then
    let b = extvar2
  end if
  let e = 1
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
  if i > 150 then
    if i < 273 then
      if relay2 = 0 then
        let e = 0
      end if
    end if
  end if
  if d = 0 then
    if t1 > 0 then
      if extvar4 > 55 then
        let e = 0
      end if
    end if
  end if
  if relay3 = 0 then
    let t3 = 0
  else
    if t3 = 0 then
      let t2 = 18000
      let t3 = 36000
    end if
    if t2 = 0 then
      let relay3 = 0
    end if
    if c > 80 then
      let relay3 = 0
    end if
  end if
  if relay3 = 1 then
    let e = 2
  end if
  if e = 0 then
    let relay1 = 0
  end if
  if e = 2 then
    let relay1 = 1
  end if
  let g = 0
  if c < 150 then
    if c > 20 then
      let g = e
    end if
  end if
  if g = 1 then
    if relay1 = 0 then
      if c <= b - h then
        let relay1 = 1
      end if
    else
      if c > b then
        let relay1 = 0
      end if
    end if
  end if
loop
end
