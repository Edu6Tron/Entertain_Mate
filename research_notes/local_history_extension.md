# Local Browser-History Import Findings

- Google My Activity requires a Google sign-in to view account-level searches, so it is not suitable for the user's requested no-login approach.
- Chrome's official `chrome.history` API documentation confirms that an extension can query visited-page URLs and receive visit events when it declares the explicit `history` permission in a Manifest V3 extension.
- The local-first design will limit itself to extracting entertainment-relevant search terms from locally stored browser-history URLs, with matching and review occurring locally before any approved titles are sent to Entertain_Mate.
- The extension will not request cookies, passwords, Gmail, Drive, or general account-data permissions.

Sources: https://myactivity.google.com/ and https://developer.chrome.com/docs/extensions/reference/api/history

## Metadata and artwork findings

TMDb documents a poster-image URL pattern based on configuration values and each title's returned poster path, making it a suitable option for artwork after a user-approved title is matched. OMDb documents title and IMDb-ID lookup parameters, but requires an API key; its poster service is patron-only. The implementation should therefore use a user-supplied, server-side metadata credential and show only source-provided ratings or review links. It must never generate or present invented ratings, reviews, or testimonials.

Sources: https://developer.themoviedb.org/docs/image-basics and https://www.omdbapi.com/

## Mocktail.in verification

Mocktail.in did not provide accessible review content or a public integration path. The direct domain redirected to a Sedo domain-parking page protected by a verification challenge, and an independent web search did not identify an official Mocktail.in film-review platform or API. Until the user provides a verified Mocktail.in link, documented API, or export, the dashboard must not attribute ratings or review text to Mocktail.in. The review area can instead preserve a source-link placeholder and use verified sources only after their permitted integration method is confirmed.

## Moctale.in verification

Moctale.in is an active Indian entertainment tracking and community-review platform operated by Men of Culture Media Pvt. Ltd. Its public home page describes tracking, rating, and sharing reviews, but no public developer API or export endpoint was found. Its terms describe the platform as a source of information, reviews, and discussions and identify `help@moctale.in` for contact. The integration will therefore use a canonical Moctale search or review link only, without copying review text, rating values, poster artwork, or any protected platform data, unless Moctale grants a documented API or written permission.

Sources: https://www.moctale.in/ and https://www.moctale.in/terms-of-service
