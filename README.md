# Budget Flow Pro

Budget Flow Pro is the single merged app identity for this project.

## Merge note

**Budget Planner Premium+ has been merged into Budget Flow Pro.**

Use **Budget Flow Pro** everywhere going forward for:
- app name
- installed PWA name
- browser title
- Netlify deployment
- nevels1953.com
- receipt scanner
- OCR reader
- PDF export
- cloud backup
- expense categories
- admin dashboard
- Stripe subscription preparation

Budget Planner Premium+ should be treated as an older/alternate name and should not be used as a separate public app.

## Private beta deployment

This app is intended to run at:

```text
https://nevels1953.com
```

Recommended Netlify settings:

- Base directory: leave empty
- Build command: `echo 'Deploying Budget Flow Pro'`
- Publish directory: `.`
- Custom domain: `nevels1953.com`

## Private testing visibility

The app currently includes `noindex`, `nofollow`, and `noarchive` metadata so it can be tested privately before public launch.

## Camera/OCR testing

Camera access requires HTTPS. Test on:

- `https://nevels1953.com`
- Netlify HTTPS preview URL
- localhost during development

Plain HTTP will usually block the camera.
