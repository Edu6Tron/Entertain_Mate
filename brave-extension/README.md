# Entertain_Mate Private Brave Extension

This companion extension has one purpose: it can send Google Search queries from **your local Brave history** to your private Entertain_Mate dashboard so the dashboard can identify entertainment titles, add them to your collection, and fetch poster metadata. It does **not** request access to Gmail, Google Drive, cookies, saved passwords, tabs, page contents, or any other Google-account data.

## Install privately in Brave

1. Keep this `brave-extension` folder on your computer after downloading the private repository.
2. Open `brave://extensions` in Brave and enable **Developer mode**.
3. Select **Load unpacked** and choose this `brave-extension` folder.
4. Open Entertain_Mate, choose **Connect Brave**, and generate a private token.
5. Open the extension, paste the dashboard address and token, then save the private connection.

## Privacy controls

Live capture is enabled only when you keep the extension toggle switched on. It watches for Google Search URLs, extracts the search query locally, and sends only that query for automatic movie or television matching. The one-time backfill buttons search your browser history locally and batch the extracted Google searches; Brave's history permission is required because the extension cannot perform the optional backfill without it.

You can disable live capture in the extension at any time. A future dashboard control will revoke a generated token, preventing the extension from adding further entries.

## Matching and review sources

TMDb is used server-side to identify titles and obtain poster metadata. Moctale is represented only by a source link until it provides a public, permitted API or direct integration agreement. No Moctale review text, user reviews, scores, or artwork are copied into Entertain_Mate. IMDb-linked ratings remain disabled until an OMDb API key is supplied and validated.

## IMDb-rating status

The dashboard intentionally leaves the IMDb-linked rating field blank until a valid OMDb key is configured and passes its server-side check. This avoids showing estimates, placeholders, copied ratings, or fabricated review data.
