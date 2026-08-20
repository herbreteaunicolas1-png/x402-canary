# Source Policy — candidate 0.5.0

## Allowed external sources
- deps.dev API v3 for public package/version, license metadata and resolved dependency graphs.
- OSV.dev API v1 for vulnerability queries/advisory records.
- Frankfurter v2 for reference FX data.
- USGS Earthquake Hazards Program public daily GeoJSON feed.
- Cloudflare DNS-over-HTTPS for public DNS facts.
- Local deterministic transforms and bounded changed-diff inspection.

## Product constraints
- Dependency Gate is a derived risk/preflight product, not resale of raw deps.dev/OSV datasets.
- Preserve provenance in responses; never imply provider endorsement.
- License metadata is informational and not legal advice.
- Release Gate processes bounded supplied diff evidence only and does not require repository upload.

## Explicit exclusions
LinkedIn/social scraping, phone/person enrichment, mailbox probing, data-broker datasets, trading signals/execution, gambling, medical/legal/tax advice, repository exfiltration, unrestricted proxying, secret storage, and any paid-upstream resale path whose rights/costs are not documented and approved.

## Rule
No new upstream is added until commercial-use/redistribution fit, variable cost, rate limits, freshness and failure mode are documented and pass economics/legal gates.
