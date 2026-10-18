# muhammadusmandev.com

Static one-page portfolio. No build step: everything that ships lives in `public/`.

```
public/
  index.html          page markup and content
  css/style.css       all styles (tokens at the top)
  js/main.js          interactions + the three demos
  js/game.js          asteroids mini-game, loaded only when someone clicks Play
  assets/             résumé PDF, favicon
  404.html
firebase.json         hosting config (clean URLs, cache headers)
.firebaserc           Firebase project id
```

## Preview locally

```
python -m http.server 8731 --directory public
# or: firebase serve --only hosting
```

## Deploy

Deploys run on GitHub Actions (`.github/workflows/`):

- **Push to `main`** → live at https://muhammadusmandev.com (about a minute).
- **Open a pull request** → a preview URL is posted on the PR; it expires after 7 days.
- **Rollback** → Firebase console → Hosting → release history → Rollback.

The workflows authenticate with the `FIREBASE_SERVICE_ACCOUNT_MUHAMMADUSMAN_IO` repo secret
(service account `github-action-1424829337@muhammadusman-io.iam.gserviceaccount.com`).

Manual deploy, if ever needed: `firebase deploy --only hosting`.

DNS lives at GoDaddy: `A @ → 199.36.158.100`, TXT `hosting-site=muhammadusman-io`, `www` → redirected by Firebase.

## Updating content

- Résumé: replace `public/assets/Muhammad-Usman-Resume.pdf`.
- Text: edit `public/index.html` directly.
