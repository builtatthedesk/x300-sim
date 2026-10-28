# X-300 BASIC simulator

An unofficial, in-browser simulator and tutorial site for the BASIC scripts that run on ControlByWeb X-300 temperature controllers. Write a script, run simulated days, watch the relays, and check it before uploading it to a real unit.

Not affiliated with ControlByWeb / Xytronix. For official docs see the [X-300 manual](https://www.controlbyweb.com/x300/x-300_users_manual.pdf).

## What's here

- `src/lib/x300.js`: the interpreter (pure ES module, no dependencies): `check(src)` for static checks, `Machine` to run.
- `src/lib/world.js`: a simple room model and `simulate()` for running scripts over simulated days.
- `src/assets/playground.js`: the browser playground.
- `src/learn/`: seven lessons; `src/case-study.md`: a real script through four versions.
- `src/examples/`: every script on the site. Each one is tested in `test/`.

## Develop

```bash
npm install
npm test
npm run dev
```

`npm run build` writes `_site/`. Set `PATH_PREFIX=/x300/` to build for a sub-path.

## Help wanted

Several behaviours aren't documented by the manual (see `/about/#known-unknowns` on the site). If you own an X-300 and can test one, please open an issue.

## License

MIT.
