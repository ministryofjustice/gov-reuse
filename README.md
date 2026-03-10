# hmpps-template-typescript

[![Security trivy dependency check](https://github.com/ministryofjustice/gov-reuse/actions/workflows/security_trivy.yml/badge.svg)](https://github.com/ministryofjustice/gov-reuse/actions/workflows/security_trivy.yml)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/gov-reuse)

Website for the Gov Reuse Library.

This project is community managed by volunteers from across Government digital services via the `#reuse-library` Slack channel.
Please raise any questions or queries there. Contributions welcome!

Our security policy is located [at GitHub](https://github.com/ministryofjustice/gov-reuse/security/policy).

### Dependencies

### REDIS

When deployed to an environment with multiple pods we run applications with an instance of REDIS/Elasticache to provide
a distributed cache of sessions.
The template app is, by default, configured not to use REDIS when running locally.

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
