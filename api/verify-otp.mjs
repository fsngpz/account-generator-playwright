import {chromium} from 'playwright-core';

// Vercel Node.js Serverless Function (ESM)
// Endpoint: /api/verify-otp
//
// This function:
// 1. Connects to Browserless.io cloud browser service using playwright-core.
// 2. Verifies the phone number with the OTP code.
// 3. Updates the user profile with a new phone number.

export default async function handler(req, res) {
    const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

    if (!BROWSERLESS_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'BROWSERLESS_TOKEN environment variable is required',
        });
    }

    const browserlessEndpoint = process.env.BROWSERLESS_ENDPOINT || 'wss://chrome.browserless.io';
    const wsEndpoint = `${browserlessEndpoint}?token=${BROWSERLESS_TOKEN}`;

    const body = typeof req.body === 'object' && req.body ? req.body : {};

    // Required fields
    const otpCode = body.otpCode;
    const phoneNumber = body.phoneNumber;
    const newPhoneNumber = body.newPhoneNumber;
    const authToken = body.authToken; // Token from registration response

    if (!otpCode) {
        return res.status(400).json({
            success: false,
            error: 'otpCode is required',
        });
    }

    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            error: 'phoneNumber is required',
        });
    }

    if (!authToken) {
        return res.status(400).json({
            success: false,
            error: 'authToken is required',
        });
    }

    const authHeader = `Bearer ${authToken}`;

    let browser;

    try {
        console.log('Connecting to Browserless.io for OTP verification...');
        console.log('Endpoint:', wsEndpoint.replace(BROWSERLESS_TOKEN, '***'));

        try {
            browser = await chromium.connectOverCDP(wsEndpoint);

            if (!browser) {
                throw new Error('Browser object is null - connection may have failed');
            }

            if (browser.isConnected && !browser.isConnected()) {
                throw new Error('Browser connection not established');
            }

            console.log('Successfully connected to Browserless.io');
        } catch (connectError) {
            console.error('Browserless connection error:', connectError);
            throw new Error(`Failed to connect to Browserless.io: ${connectError.message}`);
        }

        // Get or create a browser context
        let context;
        const contexts = browser.contexts();
        if (contexts && contexts.length > 0) {
            context = contexts[0];
            console.log('Using existing browser context');
        } else {
            context = await browser.newContext();
            console.log('Created new browser context');
        }

        const page = await context.newPage();
        console.log('Created new page');

        let verifyPhoneResponse = null;
        let updateProfileResponse = null;

        // 1. Verify the phone number with OTP code
        try {
            console.log('Verifying phone number with OTP code:', otpCode);

            const verifyPhoneResponseObj = await page.request.post(
                'https://app.pyng.com.au/payments/profile/verifyUserPhoneNumber',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader,
                    },
                    data: {
                        code: otpCode,
                        phoneNumber: phoneNumber,
                    },
                }
            );

            if (verifyPhoneResponseObj.ok()) {
                try {
                    verifyPhoneResponse = await verifyPhoneResponseObj.json();
                    console.log('Phone number verified successfully');
                } catch {
                    verifyPhoneResponse = {
                        status: verifyPhoneResponseObj.status(),
                        message: 'Phone number verified'
                    };
                }
            } else {
                console.warn('Failed to verify phone number:', verifyPhoneResponseObj.status());
                verifyPhoneResponse = {
                    error: `Failed to verify phone number: ${verifyPhoneResponseObj.status()}`,
                    status: verifyPhoneResponseObj.status(),
                };
            }
        } catch (verifyError) {
            console.error('Error verifying phone number:', verifyError);
            verifyPhoneResponse = {
                error: verifyError.message || 'Failed to verify phone number',
            };
        }

        // 2. Update user profile with new phone number (only if verification succeeded)
        if (!verifyPhoneResponse?.error) {
            try {
                console.log('Updating user profile with new phone number:', newPhoneNumber);

                const updateProfileResponseObj = await page.request.put(
                    'https://app.pyng.com.au/payments/profile/updateUserProfile',
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader,
                        },
                        data: {
                            mobileNumber: newPhoneNumber,
                        },
                    }
                );

                if (updateProfileResponseObj.ok()) {
                    try {
                        updateProfileResponse = await updateProfileResponseObj.json();
                        console.log('User profile updated successfully');
                    } catch {
                        updateProfileResponse = {
                            status: updateProfileResponseObj.status(),
                            message: 'User profile updated'
                        };
                    }
                } else {
                    console.warn('Failed to update user profile:', updateProfileResponseObj.status());
                    updateProfileResponse = {
                        error: `Failed to update user profile: ${updateProfileResponseObj.status()}`,
                        status: updateProfileResponseObj.status(),
                    };
                }
            } catch (updateError) {
                console.error('Error updating user profile:', updateError);
                updateProfileResponse = {
                    error: updateError.message || 'Failed to update user profile',
                };
            }
        } else {
            console.warn('Skipping profile update because phone verification failed');
        }

        const success = !verifyPhoneResponse?.error && !updateProfileResponse?.error;

        return res.status(success ? 200 : 400).json({
            success: success,
            otpCode: otpCode,
            phoneNumber: phoneNumber,
            newPhoneNumber: newPhoneNumber,
            verifyPhoneResponse,
            updateProfileResponse,
        });
    } catch (error) {
        console.error('Vercel Playwright verify OTP error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Unknown error',
        });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (error) {
                console.error('Error disconnecting browser:', error);
            }
        }
    }
}

