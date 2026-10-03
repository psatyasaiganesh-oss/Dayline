# Dayline — News & Weather

A responsive daily news reader with live India and world headlines and local weather.

## Features
- Publisher RSS feeds, fetched on the server: The Times of India (India); BBC News (world, business, technology, science); BBC Sport.
- Seven news categories, original story links, publication timestamps, photographs when supplied by the feed, and progressive headline loading.
- Current conditions and a five-day forecast from Open-Meteo, in Celsius. Current weather is model-estimated rather than an observation from a local station.
- Worldwide city search, optional browser geolocation, and a city preference saved only on that device.
- News refreshes on opening, returning to the tab, and every five minutes while visible. Weather refreshes every ten minutes while visible. No scheduled background automation or API key is needed.
- Explicit loading, partial-source, stale-feed, retry and error states. No fabricated or static fallback headlines or weather.

## Architecture
React with the Vinext starter and a Cloudflare-compatible server. The browser calls same-origin `/api/news`, `/api/weather`, and `/api/locations` routes. The server contacts only fixed upstream hosts and validates user parameters. Feed text is sanitized and rendered as React text; article URLs accept only HTTP(S). Short-lived server caches limit repeated upstream requests; no database or application accounts are needed.

## Local development
Use the package manager recorded in the lockfile. Run `pnpm dev` in a normal local setup, or the supervised Sites preview when working in the managed environment. Build with `pnpm build`. Deploy through Sites with `.openai/hosting.json`.

## Data providers
- https://timesofindia.indiatimes.com/rss.cms
- https://feeds.bbci.co.uk/news/world/rss.xml
- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/geocoding-api

Availability and refresh frequency depend on the publishers and weather provider. Weather uses Open-Meteo's free noncommercial endpoint; commercial use requires checking its current service terms. All story text and images belong to their respective publishers; full articles open at the publisher rather than being reproduced. Precise device coordinates are requested only after the visitor chooses “Use my current location” and are sent to Open-Meteo through the weather endpoint.
