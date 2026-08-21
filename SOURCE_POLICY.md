# Source Policy — candidate 0.5.0

## Allowed external sources
- deps.dev API v3 for public package/version, license metadata and resolved dependency graphs.
- OSV.dev API v1 for vulnerability queries/advisory records.
- npm Public Registry APIs (`registry.npmjs.org`) for public package/version metadata and published tarballs. npm Open Source Terms expressly permit replication/data access through the Public APIs; npm's crawler policy states public-registry tarballs may be downloaded for inspection/experimentation. Requests are on-demand, bounded and cached rather than bulk crawling.
- Cloudflare Browser Run Worker binding for stateless rendering of public HTTPS pages. No browser API token or user credentials are accepted. Targets are normalized, restricted to HTTPS/443 hostnames and checked for public DNS resolution before Browser Run is called.
- Frankfurter v2 for reference FX data.
- USGS Earthquake Hazards Program public daily GeoJSON feed.
- Cloudflare DNS-over-HTTPS for public DNS facts and public-target resolution checks.
- Local deterministic transforms and bounded changed-diff inspection.

## Product constraints
- Dependency Gate is a derived risk/preflight product, not resale of raw deps.dev/OSV datasets.
- NPM Symbol Context and NPM API Diff are derived, bounded coding context over public package/version data; they do not expose npm account/private-package APIs and never enumerate the registry in bulk.
- Browser Context is paid read-only rendering context, not an unrestricted forwarding proxy: no arbitrary headers, cookies, credentials, scripts, form submission or authenticated browsing are accepted.
- Preserve provenance in responses; never imply provider endorsement.
- License metadata is informational and not legal advice.
- Release Gate processes bounded supplied diff evidence only and does not require repository upload.

## Explicit exclusions
LinkedIn/social scraping, phone/person enrichment, mailbox probing, data-broker datasets, trading signals/execution, gambling, medical/legal/tax advice, repository exfiltration, unrestricted proxying, secret storage, authenticated browser proxying, private/internal URL access, and any paid-upstream resale path whose rights/costs are not documented and approved.

## Rule
No new upstream is added until commercial-use/redistribution fit, variable cost, rate limits, freshness and failure mode are documented and pass economics/legal gates.
