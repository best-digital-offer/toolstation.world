# ToolStation.world

ToolStation is an existing static tools website extended with browser-side JSON utilities and practical JSON guides. The new JSON conversion and validation work runs in the page without a backend, database, Supabase, Vercel, or paid API. The production site is built as static files for GitHub Pages.

## Local build and tests

Requirements: Node.js 22 or newer. The project has no runtime npm dependencies.

```powershell
npm run build
npm test
```

The build writes the deployable website to `_site/`. It regenerates the internal keyword map from `planning/keyword-research.csv`, creates the JSON tool pages, renders the article sources into static HTML, and creates the sitemap. The original keyword values and their mapping remain in `planning/`, which is excluded from `_site/` so keyword metrics are not public.

To preview `_site/`, serve it with any static file server. Do not deploy the repository root; publish only `_site/`.

## GitHub Pages

The workflow at `.github/workflows/static.yml` builds the site and publishes `_site/` when a commit reaches `main` or when manually started from GitHub Actions. In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. The workflow uses the standard Pages artifact and deployment actions. Configure the repository's existing custom domain in Pages if desired and keep its DNS records pointed at GitHub Pages.

Publishing changes to the default branch deploys them publicly. Review the generated output and repository diff before merging or pushing to `main`. A branch push does not deploy under the included workflow.

## Project map

- `assets/json-tools.js`: browser-side parsing, formatting, conversions, tree view, schema subset, and file handling.
- `assets/json-tools.css`: styles for the JSON tools pages and responsive editor.
- `assets/json-navigation.js`: mobile navigation and theme toggle.
- `data/json-tools.json`: metadata for the 37 tool routes.
- `scripts/build-json-pages.mjs`: generates the JSON tools hub and tool routes.
- `scripts/build-site.mjs`: complete static site build, article rendering, and sitemap generation.
- `content/articles/*.md`: article source with frontmatter and editorial content.
- `planning/keyword-research.csv`: original supplied research; do not publish its unverified metrics.
- `planning/keyword-map.json`: row-preserving, internal mapping and documented metric caveats.
- `tests/json-tools.test.mjs`: core behavior, content, route, and internal-link checks.
- `_site/`: generated output; ignored by Git and rebuilt by the workflow.

## Editing guides and keyword mapping

Add or edit Markdown files in `content/articles/`. Frontmatter fields include `title`, `description`, `primaryKeyword`, `secondaryKeywords`, `relatedTools`, and `relatedArticles`. Each article must contain at least 1,000 editorial words. Internal links to tool routes should use their exact `/tools/json/<slug>/` routes; sibling article links can name the article slug. Run the build and tests after changing content.

The CSV has 149 records and no duplicates. Source country, date, provider, the meaning of `Competition`, and the `Score` formula were not supplied. The internal map preserves original field values, records the mapping decision, and does not describe the supplied competition value as organic keyword difficulty. Do not expose the raw volumes, CPC, competition, or score in public copy until their provenance is confirmed.

## Advertising and privacy configuration

New JSON-page ad slots are reserved and disabled. `site-config.json` has an empty publisher ID and `ads.enabled` is false; these are inactive configuration values, not real ad identifiers. Enable ads only after entering verified publisher and unit identifiers and configuring any audience-appropriate consent solution required for the services and regions in which the site operates. A cookie notice by itself does not establish legal compliance, and AdSense approval is not guaranteed.

The existing site already contains other pages, scripts, and advertising-related configuration. Review those separately before making privacy claims or enabling additional services. The privacy policy has been updated to distinguish JSON-page processing from the rest of the site and should be reviewed by the site owner against the services actually enabled.

## Architecture and limitations

All newly added JSON tools are static HTML, CSS, and JavaScript. Core utility actions run in the browser. The JSON Schema validator implements a documented subset rather than the complete Draft 2020-12 specification. The JSON-LD previewer checks basic structure and does not fetch remote contexts or verify rich-result eligibility. XML conversion documents its mapping choices and rejects DOCTYPE declarations. CSV conversion requires explicit choices for nested values and cannot preserve every JSON shape in a flat table.

There are no secrets or environment variables required for the static build. Do not add credentials, private keyword metrics, or personal data to published files.
