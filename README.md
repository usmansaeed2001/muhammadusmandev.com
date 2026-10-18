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

1. Put your Firebase project id in `.firebaserc` (or run `firebase use --add`).
2. `firebase deploy --only hosting`
3. Firebase console → Hosting → **Add custom domain** → `muhammadusmandev.com` (and `www.muhammadusmandev.com`
   redirecting to it). Add the A/TXT records it shows at your domain registrar. SSL is issued automatically.

## Updating content

- Résumé: replace `public/assets/Muhammad-Usman-Resume.pdf`.
- Text: edit `public/index.html` directly.
