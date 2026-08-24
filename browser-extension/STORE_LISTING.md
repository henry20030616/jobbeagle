# JobBeagle Chrome Web Store — Listing Draft

> **Status (2026-08-24):** Owner asked for one-click install — **submit for Chrome Web Store review.**
> After the listing URL exists, set `NEXT_PUBLIC_CHROME_WEBSTORE_URL` and sync Vercel.

## Single purpose
Help job seekers capture a job posting from supported boards and open JobBeagle Pre-Flight for AI triage analysis.

## Privacy policy URL
https://www.jobbeagle.com/privacy

## Terms URL
https://www.jobbeagle.com/terms

## Permission justifications
| Permission | Why |
|------------|-----|
| `activeTab` | Read the job page the user is viewing when they click the icon |
| `scripting` | Inject scrape script on click |
| `tabs` | Open Pre-Flight results tab |
| Host: LinkedIn / Indeed / ZipRecruiter / Glassdoor / 104 | Whitelisted job boards only |
| Host: jobbeagle.com | POST capture + open pre-flight |

## Store screenshots checklist
1. LinkedIn job → click extension → Pre-Flight with company/title/JD
2. Indeed job capture
3. Lite report sample
4. Paywall / credits screen

## Packaging (developer)
```bash
bash scripts/ops/pack-extension.sh
# writes jobbeagle-extension-<manifest version>.zip at repo root (gitignored)
```

Upload the zip in [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) → New item → **Submit for review**.

## Notes
- Do not obfuscate code.
- Keep `host_permissions` minimal (already whitelisted).
- Version must match `manifest.json`.
