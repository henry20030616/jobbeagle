const WEBSITE_ORIGIN = 'https://www.jobbeagle.com';
// Dev: const WEBSITE_ORIGIN = 'http://localhost:3000';

const params = new URLSearchParams(window.location.search);
const sid = params.get('sid');
const error = params.get('error');

let target = `${WEBSITE_ORIGIN}/pre-flight`;
if (sid) {
  target += `?sid=${encodeURIComponent(sid)}&embedded=1`;
} else if (error) {
  target += `?error=${encodeURIComponent(error)}&embedded=1`;
} else {
  target += '?embedded=1';
}

const iframe = document.createElement('iframe');
iframe.src = target;
iframe.title = 'JobBeagle Pre-Flight';
iframe.allow = 'clipboard-write';
iframe.onload = () => {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();
};
document.body.appendChild(iframe);
