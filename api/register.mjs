import {chromium} from 'playwright-core';

// Vercel Node.js Serverless Function (ESM)
// Endpoint: /api/register
//
// This function:
// 1. Connects to Browserless.io cloud browser service using playwright-core.
// 2. Performs the registration flow on the Pyng merchant site.
// 3. Waits for the /payments/profile/getUserProfile API call.
// 4. Returns any detected token and useful request/response data as JSON.

export default async function handler(req, res) {
    const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN; // Set this in Vercel Env Vars

    if (!BROWSERLESS_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'BROWSERLESS_TOKEN environment variable is required',
        });
    }

    // Construct the WebSocket URL for Browserless.io
    // Browserless.io CDP endpoint format
    // You can use different endpoints:
    // - wss://chrome.browserless.io?token=TOKEN (standard)
    // - wss://production-sfo.browserless.io/chromium?token=TOKEN (with stealth mode)
    const browserlessEndpoint = process.env.BROWSERLESS_ENDPOINT || 'wss://chrome.browserless.io';
    const wsEndpoint = `${browserlessEndpoint}?token=${BROWSERLESS_TOKEN}`;

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
        console.log('Connecting to Browserless.io...');
        console.log('Endpoint:', wsEndpoint.replace(BROWSERLESS_TOKEN, '***'));

        // Connect to Browserless.io cloud browser using CDP (Chrome DevTools Protocol)
        // Browserless.io provides a remote browser instance via WebSocket
        // connectOverCDP connects to an existing browser via CDP protocol
        // This should NOT launch a local browser - it connects remotely

        // Connect to Browserless.io - this should NOT launch a local browser
        // If you see errors about /tmp/chromium, it means connectOverCDP failed
        try {
            browser = await chromium.connectOverCDP(wsEndpoint);

            // Verify connection succeeded
            if (!browser) {
                throw new Error('Browser object is null - connection may have failed');
            }

            // Check if browser is actually connected (if method exists)
            if (browser.isConnected && !browser.isConnected()) {
                throw new Error('Browser connection not established');
            }

            console.log('Successfully connected to Browserless.io');
        } catch (connectError) {
            console.error('Browserless connection error:', connectError);
            console.error('Error details:', {
                message: connectError.message,
                stack: connectError.stack,
                endpoint: wsEndpoint.replace(BROWSERLESS_TOKEN, '***')
            });
            throw new Error(`Failed to connect to Browserless.io: ${connectError.message}. Please verify your BROWSERLESS_TOKEN is correct and the endpoint is accessible.`);
        }

        // Get or create a browser context
        // When connecting via CDP, Browserless may already have a default context
        // We can use existing contexts or create a new one
        let context;
        const contexts = browser.contexts();
        if (contexts && contexts.length > 0) {
            // Use the first existing context
            context = contexts[0];
            console.log('Using existing browser context');
        } else {
            // Create a new context
            context = await browser.newContext();
            console.log('Created new browser context');
        }

        const page = await context.newPage();
        console.log('Created new page');

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
        await page.fill('input[name="password-confirm"]', password);

        // 4. Submit the form (update selector if needed)
        await page.click('input[type="submit"]');

        // 5. Wait for the specific API call after registration.
        const profileResponse = await page.waitForResponse(
            (response) =>
                response
                    .url()
                    .includes('/payments/profile/getUserProfile') && response.ok(),
            {timeout: 60_000},
        );

        const profileRequest = profileResponse.request();
        const requestHeaders = profileRequest.headers();

        const authHeader =
            requestHeaders.authorization || requestHeaders.Authorization || null;

        let responseJson = null;
        let detectedToken = null;

        try {
            responseJson = await profileResponse.json();
            detectedToken = authHeader.substring("Bearer ".length);
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
                // Disconnect from Browserless (don't close as it's a remote browser)
                await browser.close();
            } catch (error) {
                console.error('Error disconnecting browser:', error);
                // Ignore close errors
            }
        }
    }
}


