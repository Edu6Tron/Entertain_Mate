# Standalone HTML Companion Verification

The direct `/companion.html` route opened without the production application shell and presented the browser-local Entertain_Mate interface. Its empty-state dashboard exposed the theme selector, add-title action, search and filter controls, local selection control, timeline, and explicit privacy boundary. The add-title action opened a form with title, exact media type, exact watch status, month, category, optional poster URL, and notes fields.

The standalone page does not preload production entries and states that it has no Google, Brave, account, database, or server-credential connection.

## Local interaction check

Using the standalone form, a sample Movie entry was saved with an August 2026 month, Drama category, and local note. The page updated the collection count, month selector, August 2026 timeline node, month group, and card controls. This confirms that entry creation and local grouping work without a production account or backend connection.

## Theme and reload check

The theme selector changed the page to Midnight Screening. On a fresh direct visit to `/companion.html`, the Midnight theme and the browser-local sample entry both remained present. This verifies that the standalone page persists its theme setting and local entries across page reloads.

## Mobile layout check

At a 375-pixel mobile viewport, the direct HTML page displayed a single-column hero, readable action buttons, stacked statistics, readable filters, the empty collection state, and the privacy notice without horizontal overflow. The static-page environment started with no local entry, as expected for a separate browser context.
