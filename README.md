# Gov Reuse Library

[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/gov-reuse)

Website for the Gov Reuse Library.

This project is community managed by volunteers from across Government digital services via the `#reuse-library` Slack channel.
Please raise any questions or queries there. Contributions welcome!

Our security policy is located [at GitHub](https://github.com/ministryofjustice/gov-reuse/security/policy).

## Dependencies

### REDIS

When deployed to an environment with multiple pods we run applications with an instance of REDIS/Elasticache to provide
a distributed cache of sessions.
The template app is, by default, configured not to use REDIS when running locally.

## Architecture & Search System

The search system follows a **modular, service-layer architecture** designed for maintainability, testability, and clarity. All layers have explicit responsibilities with minimal coupling.

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│  HTTP Request Handler (Express Routes)                      │
│  routes/index.ts - Route definitions & service composition  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  HTTP Controllers (Thin Request/Response Layer)             │
│  controllers/SearchController.ts                            │
│  ├─ Handles HTTP requests                                   │
│  ├─ Validates inputs                                        │
│  ├─ Coordinates services                                    │
│  └─ Returns JSON/HTML responses                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Service Layer (Business Logic)                             │
│  ├─ QueryExpansionService                                   │
│  │  ├─ Stemming (convert words to base form)                │
│  │  ├─ Synonym expansion (ai → artificial intelligence)     │
│  │  └─ Stop word filtering (the, a, and, etc)              │
│  │                                                          │
│  ├─ SearchScoringService                                    │
│  │  ├─ Multi-factor scoring algorithm                       │
│  │  ├─ Title matching (50 points)                           │
│  │  ├─ Description matching (12 points)                     │
│  │  └─ External enrichment weighting                        │
│  │                                                          │
│  └─ (SearchIndexRepository integrated in data access)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Data Access Layer (Repositories & Clients)                 │
│  ├─ SearchIndexRepository (loaded JSON indices)             │
│  ├─ InfoService (catalogue data from APIs)                  │
│  ├─ AuditService (optional event logging)                   │
│  └─ Generated search index from build-time crawler          │
└──────────────────────────────────────────────────────────────┘
```

### Search Query Flow

**Autocomplete (Real-Time Client Suggestions)**

```
User Input (e.g., "date picker")
         │
         ▼
    Debounce (180ms)
         │
         ▼
   Fetch /search-suggest
         │
         ├─────────────────────┬─────────────────────┐
         ▼                     ▼                     ▼
 Match Components    Search Catalogue       Return merged
 (from external)     (local scoring)        results (max 15)
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                       │
                       ▼
            Render in dropdown overlay
                (keyboard navigation)
                       │
                       ▼
         User clicks result → Opens in new tab
```

**Component Matching (Design Systems)**

```
Query: "date picker"
        │
        ▼
Expand terms: [date, picker, datepicker, calendar]
        │
        ▼
Score each component entry by name matching
        │
        ▼
Aggregate by component name (group all sources)
        │
        ├─ Result: "Date Picker" from 4 different design systems
        │         with links to each implementation
        │
        ▼
Return to controller
        │
        ▼
Flatten for suggestions (show each source separately)
```

**Full Search (Catalogue Query)**

```
User submits search form
        │
        ▼
Validate query length (minimum 2 chars)
        │
        ▼
Log audit event (if enabled)
        │
        ▼
Fetch all catalogue items:
  ├─ Design Systems
  ├─ Manuals
  ├─ Products
  ├─ Service Patterns
  ├─ Standards
  └─ Style Guides
        │
        ▼
Score each item against query:
  1. Expand query terms (stemming + synonyms)
  2. Match title (50 points if match found)
  3. Match description (12 points)
  4. Match other fields (6 points)
  5. Consider external enrichment data
        │
        ▼
Sort by score (highest first)
        │
        ▼
Apply diversity constraints:
  ├─ Max 4 per domain (e.g., gov.uk)
  ├─ Max 4 per department
  └─ Max 1 per title
        │
        ▼
Render results page with filters
```

### Service Responsibilities

**QueryExpansionService**
- Normalise terms to lowercase
- Apply simple stemming (remove suffixes: -ing, -ed, -s, -tion)
- Expand queries with synonyms (e.g., "form" → "forms")
- Filter stop words (common words that don't help matching)

**SearchScoringService**
- Implements multi-factor scoring algorithm
- Uses token-based matching for flexibility
- Combines signals from title, description, and external data
- Returns score between 0 and maximum (for ranking)

**SearchIndexRepository**
- Loads pre-built search index from JSON (generated at build time)
- Provides typed access to external component data
- Caches lookups by normalised URL
- Handles malformed URLs gracefully

**SearchController**
- Thin HTTP handler (coordinates services)
- Validates user inputs
- Maps service responses to JSON/HTML
- Logs audit events (with graceful failure handling)

### Key Design Principles

1. **Separation of Concerns**
   - Controllers handle HTTP only (request/response)
   - Services contain business logic (scoring, expansion)
   - Data layer handles retrieval (repositories, clients)

2. **Type Safety**
   - Strict TypeScript throughout
   - Explicit service dependencies via constructor injection
   - Well-defined interfaces for all data types

3. **Modularity**
   - Each service has single responsibility
   - Easy to test individually
   - Can be reused in other contexts

4. **Clarity**
   - Comprehensive JSDoc comments on all public methods
   - Clear naming (e.g., `scoreRecord`, `expandQueryTerms`)
   - Private methods marked explicitly
   - Detailed error handling

### Client-Side Architecture

**HeaderSearchAutocomplete Class**
- Encapsulates all autocomplete logic in one class
- Private state management (activeIndex, currentResults)
- Event delegation for keyboard navigation (arrow keys, Enter, Escape)
- HTML escaping to prevent XSS attacks
- Debounced fetch requests (180ms) with AbortController for cancellation

**Usage**
```typescript
// Initialised automatically on page load
const search = new HeaderSearchAutocomplete(container)

// Features:
// - Keyboard navigation (arrow keys cycle through results)
// - Enter selects result (respects target="_blank")
// - Escape closes dropdown
// - Click outside hides suggestions
// - Accessibility: ARIA labels, combobox roles
```

## Running the app via docker-compose

The easiest way to run the app is to use docker compose to create the service and all dependencies.

`docker compose pull`

`docker compose up`

### Running the app for development

To start the main services excluding the TypeScript app:

`docker compose up --scale=app=0`

Create an environment file by copying `.env.example` -> `.env`
Environment variables set in here will be available when running `start:dev`

Install dependencies using `npm install`, ensuring you are using `node v24`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder
to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json`
and the GitHub pipeline build config.

And then, to build the assets and start the app with esbuild:

`npm run start:dev`

### Pre-commit hooks

This project uses [pre-commit](https://pre-commit.com) to run security checks, linting, and spell checking before each commit.

Install pre-commit on macOS with Homebrew:

```bash
brew install pre-commit
```

Then install the hooks (one-time setup):

```bash
pre-commit install
```

This will configure Git to automatically run the following checks on each commit:

- **MoJ DevSecOps hooks** – scans for secrets and sensitive data (see [devsecops-hooks](https://github.com/ministryofjustice/devsecops-hooks))
- **Lint check** – runs TypeScript, YAML, and Markdown validation (`npm run validate:all`)
- **Spell check** – checks spelling across the codebase (`npm run spellcheck`)

To run all hooks manually against the entire repository:

`pre-commit run --all-files`

### Run linter

- `npm run lint` runs `eslint`.
- `npm run typecheck` runs the TypeScript compiler `tsc`.

### Run unit tests

`npm run test`

### Running integration tests

For local running, start a WireMock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

After first install ensure playwright is initialised:

`npm run int-test-init:ci`

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the UI:

`npm run int-test-ui`

## Keeping your app up-to-date

While there are multiple ways to keep your project up-to-date
this [method](https://mojdt.slack.com/archives/C69NWE339/p1694009011413449)
doesn't require you to keep cherry-picking the changes, however if that works for you there is no reason to stop.

In your service, add the template as a remote:

`git remote add template https://github.com/ministryofjustice/hmpps-template-typescript`

Create a branch and switch to it, eg:

`git checkout -b template-changes-2309`

Fetch all remotes:

`git fetch --all`

Merge the changes from the template into your service source:

`git merge template/main --allow-unrelated-histories`

You'll need to manually handle the merge of the changes, but if you do it early, carefully, and regularly, it won't be too much of a hassle.

## Change log

A [changelog](./CHANGELOG.md) for the service is available
