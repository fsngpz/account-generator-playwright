import chromium from '@sparticuz/chromium';
import playwright from 'playwright-core';

// Vercel Node.js Serverless Function (ESM)
// Endpoint: /api/register
//
// This function:
// 1. Launches a headless Chromium using @sparticuz/chromium + playwright-core.
// 2. Performs the registration flow on the Pyng merchant site.
// 3. Waits for the /payments/profile/getUserProfile API call.
// 4. Returns any detected token and useful request/response data as JSON.

export default async function handler(req, res) {
  // Only allow POST by default (safer); you can relax this if needed.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optional: accept override registration data via body
  const body =
    typeof req.body === 'object' && req.body
      ? req.body
      : {};

  const firstName = body.firstName || 'John';
  const lastName = body.lastName || 'Doe';
  const email =
    body.email || `john.doe+${Date.now()}@example.com`;
  const password = body.password || 'SecurePassword123!';

  let browser;

  try {
    // Configure chromium for serverless environment
    chromium.setHeadlessMode(true);
    chromium.setGraphicsMode(false);

    const executablePath = await chromium.executablePath();

    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Go to login page
    await page.goto('https://merchants.app.pyng.com.au/login', {
      waitUntil: 'networkidle',
    });

    // 2. Navigate to the registration / sign-up view
    const signUpCandidates = [
      'text=Sign Up',
      'text=Sign up',
      'text=Register',
      'text=Create account',
    ];

    let navigatedToRegister = false;
    for (const locator of signUpCandidates) {
      const el = page.locator(locator);
      if (await el.first().isVisible().catch(() => false)) {
        await el.first().click();
        navigatedToRegister = true;
        break;
      }
    }

    if (!navigatedToRegister) {
      // If this fails, you likely need to update the selector(s) above.
      throw new Error(
        'Could not automatically find a Sign Up / Register link. Update selectors in api/register.mjs.',
      );
    }

    // 3. Fill registration form
    // NOTE: Update these selectors to the actual ones from the live page.
    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', lastName);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    // 4. Submit the form (update selector if needed)
    await page.click('button[type="submit"]');

    // 5. Wait for the specific API call after registration.
    const profileResponse = await page.waitForResponse(
      (response) =>
        response
          .url()
          .includes('/payments/profile/getUserProfile') && response.ok(),
      { timeout: 60_000 },
    );

    const profileRequest = profileResponse.request();
    const requestHeaders = profileRequest.headers();

    const authHeader =
      requestHeaders.authorization || requestHeaders.Authorization || null;

    let responseJson = null;
    let detectedToken = null;

    try {
      responseJson = await profileResponse.json();
      detectedToken =
        responseJson?.token ||
        responseJson?.accessToken ||
        responseJson?.authToken ||
        responseJson?.jwt ||
        null;
    } catch {
      // Response is not JSON; ignore.
    }

    return res.status(200).json({
      success: true,
      emailUsed: email,
      authHeader,
      detectedToken,
      requestHeaders,
      responseJson,
    });
  } catch (error) {
    console.error('Vercel Playwright register error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}


