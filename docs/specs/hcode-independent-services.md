# HCode: independent service defaults

## Product rules

HCode is a BYOK desktop application. It must not silently send user model requests or credentials to the upstream product's gateway. Product-service defaults must not point to upstream account, business, relay, help or asset servers. HCode does not yet operate replacement hosted services.

This change is the network-default and visible-branding phase, not a claim that all legacy account/payment code or internal `zcode` identifiers have been removed. Existing third-party attribution and copyright notices remain intact. Package scopes, persisted keys and runtime protocol identifiers require a separate coordinated migration; changing these strings alone is not removal of an integration.

## Ownership and boundaries

- Shared endpoint configuration owns service defaults. Defaults use the reserved `.invalid` namespace, never a fictitious live HCode service. Explicit deployment overrides continue to work. Placeholder endpoints are not working services; features requiring hosted services remain unavailable until configured.
- The adapter endpoint-routing port returns the original user-selected URL without forwarding it to another origin. Transport owns request execution; it does not change authentication, body, streaming or cancellation semantics for a non-routed request.
- Desktop remote-runtime downloads use only explicit build/deployment configuration, with no upstream CDN fallback.
- Help defaults link to this fork's GitHub issues/discussions, not upstream forms or chat invitations.
- Bundled plugin provenance remains unchanged. Upstream asset URLs default to reserved placeholders; local seed remains the source of bundled functionality.
- No new runtime state, model calls, review loops or token-consuming work is introduced.

```text
user provider URL -> identity routing decision -> existing transport -> chosen provider
explicit service/CDN config -> existing resolver -> configured deployment
missing service config -> reserved placeholder / empty CDN candidate list
```

## Acceptance

1. Production and development env files contain no upstream service URL or OAuth client ID.
2. Shared default endpoints use `.invalid`; explicit local/self-hosted overrides still resolve.
3. Previously intercepted provider URLs, query strings and credentials are passed only to the selected provider, never the product gateway.
4. No remote CDN candidates are returned without an explicit override or build configuration.
5. Help defaults and desktop package homepage identify the HCode fork.
6. Legal notices and plugin-author provenance are preserved.
7. Run endpoint, routing, CDN and service-default regression tests, typecheck, lint and architecture checks. Report environment or baseline failures accurately.

## Follow-up scope

Remove unreachable account/Coding Plan/quota/payment implementations and their tests; migrate package names, protocol, storage keys, CLI paths and scheme together; audit bundled documentation and attribution separately. These are not accomplished merely by disabling network defaults.

## Verification of this phase

- Shared endpoint, desktop CDN/runtime-env and visible-branding suites: 62 passed, 4 platform-specific cases skipped.
- Adapter identity-routing, OAuth defaults and existing token-refresh suites: 47 passed.
- `node --test scripts/test/hcode-service-defaults.test.mjs`: 3 passed.
- Architecture changed-file check: zero violations. These modules are not all under managed-contract coverage; this does not prove runtime behavior.
- Root lint: zero errors, 136 warnings.
- Root typecheck under the pinned Node 24.14.0 (3 GB heap): fails with 693 diagnostics, including missing legacy account/provider exports in UI and desktop E2E sources. No claim of a successful application build or E2E run. A Node 22 attempt first exhausted its default heap.
- Contracts-only build is also blocked by missing `OfficialMcpAuthPortFailureReason` and `ZCodeProviderAccountAccess` exports. Runtime-focused adapter tests above still pass.
- License, notice, third-party inventory and plugin-author provenance were not edited.

Known residuals include `@zcode/*`, CLI paths and stdio protocol names, account/payment UI and localization, provider-specific E2E fixtures, Android launcher branding/defaults, and historical/bundled documentation. Some residual UI constants still contain upstream purchase links. Do not describe this phase as removal of every upstream reference or every possible network path.
