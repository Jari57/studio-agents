import { chromium, devices } from 'playwright';

const target = process.argv[2] || 'http://127.0.0.1:4174';
const cases = [
  { name: 'agent whitepaper', trigger: /Read .* whitepaper/i },
  { name: 'archive', trigger: 'Enter The Archive' },
  { name: 'investor pitch', trigger: 'Investor Pitch Deck' },
  { name: 'privacy', trigger: 'Privacy Policy' },
  { name: 'terms', trigger: 'Terms of Service' },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const profile of [
  { name: 'desktop', options: { viewport: { width: 1440, height: 900 } } },
  { name: 'mobile', options: { ...devices['Pixel 5'] } },
]) {
  const context = await browser.newContext(profile.options);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  for (const testCase of cases) {
    await page.goto(target, { waitUntil: 'networkidle' });
    const cookie = page.getByRole('button', { name: 'Accept', exact: true });
    if (await cookie.isVisible().catch(() => false)) await cookie.click();

    const trigger = page.getByRole('button', { name: testCase.trigger }).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const overlay = page.locator('.landing-modal-overlay');
    const panel = overlay.locator('.landing-modal-panel');
    await overlay.waitFor({ state: 'visible' });

    const layout = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const overlay = element.parentElement;
      const header = document.querySelector('.native-header');
      const body = element.querySelector('.modal-body');
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        overlayZ: Number.parseInt(getComputedStyle(overlay).zIndex, 10),
        headerZ: header ? Number.parseInt(getComputedStyle(header).zIndex, 10) : 0,
        bodyScrollable: body ? body.scrollHeight > body.clientHeight : true,
      };
    });

    if (layout.top < -1 || layout.bottom > layout.viewportHeight + 1) {
      throw new Error(`${profile.name} ${testCase.name} escaped viewport: ${JSON.stringify(layout)}`);
    }
    if (!(layout.overlayZ > layout.headerZ)) {
      throw new Error(`${profile.name} ${testCase.name} is below header: ${JSON.stringify(layout)}`);
    }
    await panel.locator('.modal-close').waitFor({ state: 'visible' });
    await panel.locator('.modal-close').click();
    await overlay.waitFor({ state: 'detached' });
    results.push({ profile: profile.name, modal: testCase.name, ...layout });
  }

  if (pageErrors.length) throw new Error(`${profile.name} page errors: ${pageErrors.join(' | ')}`);
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ target, status: 'pass', checks: results }, null, 2));
