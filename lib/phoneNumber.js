/**
 * Generates a random 13-digit mobile number starting with "401"
 * Format: 401 + 10 random digits = 13 digits total
 *
 * @returns {string} A 13-digit mobile number starting with "401"
 *
 * @example
 * generateMobileNumber() // Returns: "4011234567890"
 */
export function generateMobileNumber() {
    // Start with "401" (3 digits)
    const prefix = '401';

    // Generate 6 random digits
    const randomDigits = Array.from({length: 6}, () =>
        Math.floor(Math.random() * 6)
    ).join('');

    // Combine prefix + random digits = 13 digits total
    return prefix + randomDigits;
}

