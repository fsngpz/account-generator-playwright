import { chromium } from 'playwright';

/**
 * Simple Playwright script to automate registration on the Pyng merchant portal.
 *
 * NOTE:
 * - The selectors used below (`input[name="..."]`, text locators, etc.) are guesses.
 * - You will likely need to open the site in your browser, inspect the fields,
 *   and adjust the selectors to match the real DOM.
 */

// Basic test data – adjust these values or wire them up to your own generator.
const REGISTRATION_DATA = {
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe+${Date.now()}@example.com`,
  password: 'SecurePassword123!',
};

async function run() {
  const browser = await chromium.launch({ headless: false }); // set to true for headless
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Go to login page
    await page.goto('https://merchants.app.pyng.com.au/login', {
      waitUntil: 'networkidle',
    });

    // 2. Navigate to the registration / sign-up view
    // Try a few common variants; you may need to replace this with a more specific selector.
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
      console.warn(
        'Could not automatically find a Sign Up / Register link. ' +
          'Please update the selector in scripts/register.js.',
      );
    }

    // 3. Fill registration form
    // Replace these selectors with the actual ones from the registration form.
    const {
      firstName,
      lastName,
      email,
      password,
    } = REGISTRATION_DATA;

    // Example selectors – inspect the page and adjust:
    await page.fill('input[name="firstName"]', firstName);
    await page.fill('input[name="lastName"]', lastName);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="password-confirm"]', password);
    await page.fill('input[name="password-confirm"]', password);

    // If there are additional fields (e.g. business name, phone, T&Cs checkbox),
    // add them here. Example:
    //
    // await page.fill('input[name="businessName"]', 'My Test Business');
    // await page.fill('input[name="phone"]', '0400000000');
    // await page.check('input[name="termsAccepted"]');

    // 4. Submit the form
    await page.click('input[type="submit"]');

    // 5. Wait for confirmation – this may be a redirect or a success message.
    // You will probably want to replace this with something more specific,
    // for example a selector that only appears after successful registration.
    await page.waitForLoadState('networkidle');

    console.log('Registration flow executed. Verify in the browser that it succeeded.');
  } catch (err) {
    console.error('Registration automation failed:', err);
  } finally {
    // Comment this out while debugging if you want to keep the browser open.
    await browser.close();
  }
}

run();


