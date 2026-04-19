# Phase 4 — Security & Compliance Scanning Plan

**Status:** Draft for review. Nothing below is implemented yet.

**Context:** Continuation of the three-phase test-coverage initiative. Phase 1 raised backend coverage, Phase 3 replaced Cypress with Playwright for E2E. This phase layers open-source security scanning into the CI/CD pipeline with an eye toward federal compliance (DoD/Advana deployment context: STIGs, NIST 800-53, OWASP Top 10, supply-chain evidence for potential ATO work).

**Guiding principles**

- **OSS only** (per user's preference). No commercial-only tooling.
- **One PR per tool** so signal-to-noise can be evaluated independently.
- **Fail-closed only after tuning.** Every tool ships initially with `continue-on-error: true` / `allow_failure: true` so we can observe baseline noise, triage, then flip to blocking when the finding count is manageable.
- **Dual-CI parity.** Every job added to `.gitlab-ci.yml` has a matching job in `.github/workflows/` unless there's a specific reason not to (GitLab is the production pipeline; GitHub Actions is a smoke mirror).

---

## What each class of tool actually catches

Six independent vulnerability classes, each addressed by a separate step. They overlap only slightly and are all cheap to run in parallel.

| Class | What it finds | Proposed tool(s) |
|---|---|---|
| **SCA (library CVEs)** | Known CVEs in `package.json` / `yarn.lock` deps and container base images | **Trivy** (primary) + **Syft/Grype** (SBOM + second opinion) |
| **SAST (static source)** | Injection, XSS, auth bypass, insecure defaults in Node + React source | **Semgrep** (fast, OWASP Top 10 / CWE Top 25 rule packs) + **CodeQL** (deeper semantic) |
| **DAST (running app)** | Runtime OWASP Top 10 findings (XSS, SSRF, misconfigs visible only at runtime) | **OWASP ZAP** baseline scan against the GitLab ephemeral dev URL |
| **Secret scanning** | Accidental commits of PATs, keys, `.env` contents | **Gitleaks** (pre-commit + CI) |
| **IaC / container / K8s config** | Privileged containers, missing resource limits, exposed ports, bad Helm values | **Trivy config** + **Checkov** |
| **STIG / 800-53 compliance** | Host/image hardening against DISA STIGs, NIST 800-53 baselines | **OpenSCAP + SSG** or **Chef InSpec + MITRE SAF** profiles |

---

## Phased rollout (7 sequential PRs)

Each PR adds one scanner, seeds an initial ignore/baseline list, and documents how to triage findings. Ordered to catch the most immediate risks first (secrets + SCA) and to delay the noisiest tools (DAST, InSpec) until others are settled.

### Phase 4.1 — Gitleaks (secret scanning)

**Why first:** Highest-risk lowest-effort. A leaked PAT committed to this repo would immediately put `@dod-advana/*` package access at risk.

**PR contents**

- `.gitleaks.toml` at repo root — seed with the project's allowlist (e.g. `CYPRESS_CLIENT_CERTIFICATE` placeholders in `.gitlab-ci.yml`, local-dev passwords).
- `.github/workflows/security-gitleaks.yml` — runs on every push + PR, `fetch-depth: 0`, uses the official `gitleaks/gitleaks-action@v2`.
- `.gitlab-ci.yml` — new `secret-scanning-gitleaks-job` in the `🧪 security-test` stage (image: `zricethezav/gitleaks:v8`).
- `CONTRIBUTING.md` — add a "Pre-commit" section showing `pre-commit install` + `gitleaks protect --staged`.

**Noise expectations:** Low. Historical commits scanned once on first run; add `--baseline-path` with a committed baseline if >5 findings resurface.

---

### Phase 4.2 — Trivy (SCA + IaC + container config)

**Why second:** Single tool covering three bug classes. Maximum coverage per CI minute.

**PR contents**

- `.trivyignore` seeded empty; any whitelisted CVE gets a line + a dated justification comment.
- `.github/workflows/security-trivy.yml` — three matrix jobs:
  1. `trivy fs --scanners vuln,secret,misconfig frontend`
  2. `trivy fs --scanners vuln,secret,misconfig backend`
  3. `trivy config chart/` (Helm chart scan)
- `.gitlab-ci.yml` — `sca-trivy-job` in `🧪 security-test`, uploads `trivy.sarif` as an artifact, fails on CRITICAL only to start.
- Decision point: enable `trivy image` against the built container. Requires the build image to be tagged and pushed; wire in after the existing `🚧 build-chart` stage.

**Noise expectations:** Medium. Start at `--severity CRITICAL`, widen to HIGH after the initial triage.

---

### Phase 4.3 — Syft + Grype (SBOM + supply-chain evidence)

**Why third:** Generates CycloneDX/SPDX SBOMs as build artifacts — this is the durable supply-chain record you'll want for any ATO / SLSA attestation work. Grype is used to diff SBOMs against prior builds so net-new CVEs surface.

**PR contents**

- `.github/workflows/security-sbom.yml` — runs Syft on each PR and on tag, publishes `sbom.cdx.json` + `sbom.spdx.json`.
- `.gitlab-ci.yml` — `sbom-job` after `🚧 build-chart`, attaches SBOM to the pipeline and pushes it alongside the container image.
- `grype sbom:<path>` step compares the PR SBOM against the base-branch SBOM and comments net-new CVEs on the MR.

**Noise expectations:** Low. SBOMs are deterministic; Grype's diff output should be tight.

---

### Phase 4.4 — Semgrep (SAST)

**Why fourth:** Fastest SAST tool, easiest rule customization. Runs in ~30 s on this codebase.

**PR contents**

- `.semgrepignore` to exclude `cypress/`, `coverage/`, `node_modules/`, and the Playwright specs.
- `.github/workflows/security-semgrep.yml` — uses `returntocorp/semgrep-action@v1` with rule packs:
  - `p/owasp-top-ten`
  - `p/cwe-top-25`
  - `p/javascript`
  - `p/nodejs`
  - `p/react`
- `.gitlab-ci.yml` — `sast-semgrep-job` mirroring the same rule set, SARIF artifact.
- Optional: drop in a few custom rules under `.semgrep/` for project-specific patterns (e.g. flag any usage of `eval`, forbid `dangerouslySetInnerHTML` outside a known safe list).

**Noise expectations:** Medium. Initial run likely ~30–80 findings; triage pass expected before flipping the job to required.

---

### Phase 4.5 — CodeQL (deep SAST)

**Why fifth:** You already have GHAS available (demoed in `colin-d-fried/demo-python`). CodeQL overlaps with Semgrep but catches things Semgrep misses (taint tracking across many hops, inter-procedural data flow).

**PR contents**

- `.github/workflows/codeql.yml` — GitHub's generated default is fine; languages `javascript-typescript`.
- No GitLab analogue (CodeQL is GitHub-only).
- Baseline alerts are auto-attributed to existing commits; new alerts on PRs block by default, which is desirable here.

**Noise expectations:** Low–medium. CodeQL's default query suite is well-tuned; expect a handful of real findings.

---

### Phase 4.6 — OWASP ZAP baseline DAST

**Why sixth:** DAST depends on a live target. The GitLab pipeline already spins up `https://${GITLAB_USER_LOGIN}-gc.dev.advana.us` for integration tests; ZAP can attach to that same URL.

**PR contents**

- `.gitlab-ci.yml` — `dast-zap-job` in `🧪 integration-test`, depends on the helm deploy. Image: `owasp/zap2docker-stable`. Runs `zap-baseline.py` with 10–15 min timeout.
- ZAP ignores list committed as `zap/.zap-baseline-ignore.tsv` — any auth endpoints, SAML redirect URLs, or DST endpoints that return 4xx intentionally get whitelisted.
- Report: HTML + JSON attached as artifacts; JUnit converter wires into the existing `reports.junit` GitLab integration.
- No GH Actions analogue (no running app in that pipeline).

**Noise expectations:** High initially. Expect 10–30 "Informational" findings; keep the job `allow_failure: true` until the ignore list is tuned.

---

### Phase 4.7 — Checkov + compliance (IaC + STIG/800-53 baseline)

**Why last:** Most noise, most context-dependent. By this point the other tools are settled and we can focus on compliance-specific noise.

**PR contents**

**a. Checkov**
- `.github/workflows/security-checkov.yml` — scans `chart/`, `.gitlab-ci.yml`, and any `Dockerfile*`.
- `.gitlab-ci.yml` — `iac-checkov-job`.
- Checkov ships policy packs for CIS, NIST 800-53, HIPAA — enable the 800-53 + CIS packs initially.

**b. STIG / hardening evidence (pick one primary)**

- **Option A — OpenSCAP + SSG** (best for RHEL-based / UBI containers; the `${IRONBANK_NODEJS18}` image is UBI-derived):
  - `openscap-scanner` runs against the built image in a post-build job.
  - Use the `ssg-ubi8-ds.xml` datastream with the DISA STIG profile.
  - SCAP scan output → HTML + XCCDF artifact.
- **Option B — Chef InSpec + MITRE SAF profiles** (closer to what DoD programs actually run; produces HDF/OHDF that feeds Heimdall dashboards):
  - Pull the appropriate profile from `https://github.com/mitre` (e.g. `redhat-enterprise-linux-8-stig-baseline` for UBI/RHEL 8).
  - Run inside a `docker exec` step against the built container.
  - Output: HDF JSON → optional Heimdall upload.

**Recommendation:** Start with OpenSCAP because it's simpler, zero extra moving parts. Layer InSpec later if the program sponsor specifically wants HDF/Heimdall dashboards.

**Noise expectations:** High initially — STIG/800-53 profiles have hundreds of rules, many of which don't apply to a containerized app. Plan on two tuning passes before the job can be required.

---

## Cross-cutting items

### Secrets needed

- `NPMRC_FILE` (GH Actions) — already needed for test/lint workflows; blocks every new scanner that runs `npm install`.
- No new Devin-side secrets needed; Trivy/Grype/ZAP/Checkov/Gitleaks/Semgrep are all zero-config OSS.

### Iron Bank alignment

The `${IRONBANK_NODEJS18}` base image (see `.gitlab-ci.yml` `AUTO_DEVOPS_BUILD_IMAGE_EXTRA_ARGS`) inherits a lot of STIG compliance for free. Phase 4.7 should verify — not replicate — that posture.

### Dashboards / rollup

All six scanners emit SARIF or JUnit. Options for consolidated view, in rough order of cost:
1. **GitHub Security tab** (free with GHAS) — accepts SARIF upload from any tool; handles CodeQL natively.
2. **GitLab Security Dashboard** (ultimate tier) — also SARIF-based; we already have GitLab, just need the tier.
3. **Heimdall Enterprise Server** (OSS, self-hosted) — accepts HDF from InSpec + SARIF from others; the DoD-adjacent choice.

### "Don't do this" list

- Don't add Snyk / Dependabot PRs in Phase 4 — noise floor is too high. Trivy + Grype + OSS Dependabot alerts cover the same ground.
- Don't enable blocking SAST before one full triage pass. Semgrep and CodeQL both have false positives; forcing blocking from day 0 guarantees CI-bypass culture.
- Don't roll `gitleaks --redact` into commit messages. Use the action's default redaction instead.

---

## Recommended execution order

1. **Phase 4.1 Gitleaks** — 1 hour, low noise.
2. **Phase 4.2 Trivy** — 2–3 hours including baseline ignore list.
3. **Phase 4.3 Syft + Grype** — 2 hours; produces long-term artifact value.
4. **Phase 4.4 Semgrep** — 3–4 hours with triage pass.
5. **Phase 4.5 CodeQL** — 1 hour to wire, a day of triage.
6. **Phase 4.6 ZAP** — 1 day (depends on ephemeral env timing).
7. **Phase 4.7 Checkov + compliance** — 2–3 days including STIG profile choice + initial tuning.

**Prerequisites before Phase 4 kicks off:**

- Phase 3 PR (https://github.com/colin-d-fried/gamechanger-web/pull/3) merged and Playwright verified green on GitLab.
- `NPMRC_FILE` GitHub Actions secret in place (https://github.com/colin-d-fried/gamechanger-web/settings/secrets/actions) so the new scanners can `npm install`.
- Decision from the team on which compliance stack to anchor Phase 4.7 on (OpenSCAP vs InSpec/MITRE SAF).

---

## Open questions for the team

1. **Compliance anchor**: OpenSCAP + SSG, or InSpec + MITRE SAF profiles? (If the program needs Heimdall dashboards, it has to be InSpec.)
2. **Security dashboard rollup**: GitHub Security tab (free), GitLab Ultimate (paid), or Heimdall (self-hosted)?
3. **Fail-closed timeline**: acceptable to keep every new scanner at `allow_failure: true` for ~2 weeks of baseline observation, then ratchet?
4. **ATO posture**: is this deployment on a path to an ATO / cATO, and if so, do we need to emit OSCAL (NIST machine-readable control evidence) artifacts from the scanners? OSCAL output is a Checkov / InSpec feature and only worth enabling if the program sponsor will consume it.
