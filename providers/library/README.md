# Library provider for Vega

A minimal catalogue provider. It reads a `catalogue.json` that you control
(see `catalogue.example.json`) and plays the direct media links in it.
With no URL set it shows a small demo library of freely licensed films.

Offline use: the last successfully loaded catalogue is cached on the device,
and files you host locally (NAS, home server, LAN) play without internet.
Use the app's download button on any title for true offline files.

## Install
1. Fork the Vega provider template, name the fork `vega-providers`.
2. Copy this `library/` folder into `providers/` (delete `providers/example`).
3. Add the manifest entry below to `manifest.json`.
4. `npm install && npm run build`, then commit and push `dist/`.
5. In Vega: Settings -> Extensions/Providers -> enter your GitHub username.
6. Open the Library provider's settings and paste your catalogue URL.

## manifest.json entry
```json
{
  "display_name": "Library",
  "value": "library",
  "version": "1.0",
  "icon": "",
  "type": "global",
  "disabled": false
}
```

## Test
`npm test -- library`
`npm run test:provider -- library getPosts`
