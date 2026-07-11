# JobBeagle Chrome Web Store — Listing Draft

> **Status (2026-07-11):** Packaging ready. **Do not submit for review yet** (owner decision).  
> When launching publicly, remind owner to upload zip + Submit for review.

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
# From repo root — zip the extension folder (no parent path junk)
cd browser-extension
zip -r ../jobbeagle-extension-1.2.0.zip . -x "*.md" -x ".gitignore"
```

Upload the zip in Chrome Developer Dashboard → New item → **Submit for review only when owner asks to go live.**

## Notes
- Do not obfuscate code.
- Keep `host_permissions` minimal (already whitelisted).
- Version must match `manifest.json`.
