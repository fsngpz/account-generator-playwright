/**
 * Generates a secure random password
 * @param {object} options - Password generation options
 * @param {number} options.length - Password length (default: 16)
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSpecial - Include special characters (default: true)
 * @returns {string} Generated password
 * 
 * @example
 * generatePassword() // Returns: "aB3$kL9mP2#qR7!"
 * generatePassword({ length: 12 }) // Returns: "xY8$wN5bC2@"
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecial = true,
  } = options

  // Character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  // Build character pool based on options
  let charPool = ''
  if (includeUppercase) charPool += uppercase
  if (includeLowercase) charPool += lowercase
  if (includeNumbers) charPool += numbers
  if (includeSpecial) charPool += special

  // Ensure at least one character from each selected category
  let password = ''
  const requirements = []

  if (includeUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    requirements.push(uppercase)
  }
  if (includeLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    requirements.push(lowercase)
  }
  if (includeNumbers) {
    password += numbers[Math.floor(Math.random() * numbers.length)]
    requirements.push(numbers)
  }
  if (includeSpecial) {
    password += special[Math.floor(Math.random() * special.length)]
    requirements.push(special)
  }

  // Fill the rest with random characters from the pool
  for (let i = password.length; i < length; i++) {
    password += charPool[Math.floor(Math.random() * charPool.length)]
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

