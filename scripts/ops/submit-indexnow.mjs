/**
 * Submit public URLs to IndexNow (Bing and partners) and ping Google's sitemap.
 * Safe to re-run. Does not print secrets.
 */
const SITE = 'https://www.jobbeagle.com';
const KEY = 'c3f8a1e9d0b24f6a9e7c1d8b5a4e3f21';

const urls = [
  `${SITE}/`,
  `${SITE}/extension`,
  `${SITE}/samples`,
  `${SITE}/career-context`,
  `${SITE}/privacy`,
  `${SITE}/terms`,
];

async function main() {
  const keyRes = await fetch(`${SITE}/${KEY}.txt`);
  const keyBody = (await keyRes.text()).trim();
  if (!keyRes.ok || keyBody !== KEY) {
    console.error(`IndexNow key file not live yet (${keyRes.status}). Deploy first.`);
    process.exit(1);
  }

  const indexNow = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'www.jobbeagle.com',
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`IndexNow HTTP ${indexNow.status}`);
  if (indexNow.status >= 400) process.exit(1);

  const ping = await fetch(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(`${SITE}/sitemap.xml`)}`,
  );
  console.log(`Google sitemap ping HTTP ${ping.status}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
