<script setup>
import { ref, computed } from 'vue'
import { saveEmailToFirestore, checkEmailExists } from './firebase/emailService.js'

// Form state
const email = ref('')

// UI state
const step = ref('registration') // 'registration' | 'otp' | 'success'
const loading = ref(false)
const error = ref('')
const success = ref('')
const registrationResult = ref(null)
const otp = ref('')
const otpError = ref('')
const emailError = ref('')
const checkingEmail = ref(false)

// Computed
const isFormValid = computed(() => {
  return validateEmail(email.value) && !emailError.value
})

// Validation
function validateEmail(value) {
  if (!value || value.trim() === '') {
    return false
  }
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
}

// Check if email already exists in database
async function validateEmailExists() {
  emailError.value = ''
  
  if (!email.value || email.value.trim() === '') {
    emailError.value = 'Email cannot be empty'
    return
  }
  
  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return
  }
  
  checkingEmail.value = true
  
  try {
    const exists = await checkEmailExists(email.value.trim())
    if (exists) {
      emailError.value = 'This email is already registered'
    } else {
      emailError.value = ''
    }
  } catch (e) {
    console.error('Error checking email:', e)
    // Don't show error to user if check fails, just log it
  } finally {
    checkingEmail.value = false
  }
}

// Mock mode: Set to true to use mock API for testing Firebase integration
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.DEV

// Mock registration API response (for testing Firebase integration)
async function mockRegisterAPI(email) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    success: true,
    emailUsed: email,
    authHeader: `Bearer mock_token_${Date.now()}`,
    detectedToken: `mock_access_token_${Date.now()}`,
    requestHeaders: {
      'content-type': 'application/json',
      'authorization': `Bearer mock_token_${Date.now()}`,
    },
    responseJson: {
      id: `mock_user_${Date.now()}`,
      email: email,
      firstName: 'John',
      lastName: 'Doe',
      token: `mock_access_token_${Date.now()}`,
    },
    mock: true, // Flag to indicate this is a mocked response
  }
}

// API call to register account
async function generateAccount() {
  error.value = ''
  success.value = ''
  registrationResult.value = null
  emailError.value = ''
  
  // Validate email format
  if (!email.value || email.value.trim() === '') {
    emailError.value = 'Email cannot be empty'
    error.value = 'Email cannot be empty'
    return
  }
  
  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    error.value = 'Please enter a valid email address'
    return
  }
  
  // Check if email already exists
  loading.value = true
  try {
    const exists = await checkEmailExists(email.value.trim())
    if (exists) {
      emailError.value = 'This email is already registered'
      error.value = 'This email is already registered'
      loading.value = false
      return
    }
  } catch (e) {
    console.error('Error checking email:', e)
    // Continue with registration even if check fails
  }
  
  try {
    let data
    
    // Use mock API if enabled, otherwise call real API
    if (USE_MOCK_API) {
      console.log('Using mock API for registration')
      data = await mockRegisterAPI(email.value.trim())
    } else {
      // Call the registration API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
        }),
      })
      
      data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
    }
    
    registrationResult.value = data
    
    // Save email to Firebase Firestore
    try {
      await saveEmailToFirestore(email.value.trim(), {
        registrationResult: data,
        timestamp: new Date().toISOString()
      })
      console.log('Email saved to Firestore successfully')
    } catch (firebaseError) {
      // Log error but don't block the registration flow
      console.error('Error saving email to Firestore:', firebaseError)
      // You can optionally show a warning to the user
    }
    
    // Move to OTP step
    step.value = 'otp'
    success.value = 'Account created successfully! Please check your email for the OTP code.'
  } catch (e) {
    error.value = e.message || 'An error occurred during registration'
    console.error('Registration error:', e)
  } finally {
    loading.value = false
  }
}

// OTP confirmation
async function confirmOTP() {
  otpError.value = ''
  
  if (!otp.value || otp.value.length < 4) {
    otpError.value = 'Please enter a valid OTP code.'
    return
  }
  
  loading.value = true
  
  try {
    // TODO: Replace with actual OTP verification endpoint
    // For now, we'll simulate OTP confirmation
    // In a real implementation, you'd call an API like:
    // const response = await fetch('/api/verify-otp', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: email.value,
    //     otp: otp.value,
    //   }),
    // })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Move to success step
    step.value = 'success'
    success.value = 'Account verified successfully!'
  } catch (e) {
    otpError.value = e.message || 'Invalid OTP code. Please try again.'
    console.error('OTP verification error:', e)
  } finally {
    loading.value = false
  }
}

// Reset form
function resetForm() {
  step.value = 'registration'
  email.value = ''
  otp.value = ''
  error.value = ''
  success.value = ''
  otpError.value = ''
  emailError.value = ''
  registrationResult.value = null
}
</script>

<template>
  <div class="app-container">
    <div class="card">
      <!-- Header -->
      <header class="header">
        <h1 class="title">Account Generator</h1>
      </header>

      <!-- Registration Step -->
      <div v-if="step === 'registration'" class="form-container">
        <form @submit.prevent="generateAccount" class="form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
              :disabled="loading || checkingEmail"
              class="input"
              :class="{ 'input-error': emailError || (email && !validateEmail(email)) }"
              @blur="validateEmailExists"
            />
            <span v-if="emailError" class="error-text">
              {{ emailError }}
            </span>
            <span v-else-if="email && !validateEmail(email)" class="error-text">
              Please enter a valid email address
            </span>
          </div>

          <div v-if="error" class="alert alert-error">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="btn btn-primary"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <span>{{ loading ? 'Generating Account...' : 'Generate Account' }}</span>
          </button>
        </form>
      </div>

      <!-- OTP Confirmation Step -->
      <div v-if="step === 'otp'" class="otp-container">
        <div class="otp-header">
          <div class="success-icon">✓</div>
          <h2>Verify Your Account</h2>
          <p class="otp-description">
            We've sent a verification code to <strong>{{ email }}</strong>
          </p>
        </div>

        <form @submit.prevent="confirmOTP" class="otp-form">
          <div class="form-group">
            <label for="otp">Enter OTP Code</label>
            <input
              id="otp"
              v-model="otp"
              type="text"
              placeholder="Enter 6-digit code"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              required
              :disabled="loading"
              class="input input-otp"
              autofocus
            />
            <span v-if="otpError" class="error-text">{{ otpError }}</span>
          </div>

          <div v-if="success && !otpError" class="alert alert-success">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading || !otp || otp.length < 4"
            class="btn btn-primary"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <span>{{ loading ? 'Verifying...' : 'Confirm OTP' }}</span>
          </button>

          <button
            type="button"
            @click="step = 'registration'"
            class="btn btn-link"
          >
            ← Back to Registration
          </button>
        </form>
      </div>

      <!-- Success Step -->
      <div v-if="step === 'success'" class="success-container">
        <div class="success-icon large">✓</div>
        <h2>Account Created Successfully!</h2>
        <p class="success-message">Your account has been verified and is ready to use.</p>
        
        <div v-if="registrationResult" class="account-details">
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">{{ registrationResult.emailUsed }}</span>
          </div>
          <div v-if="registrationResult.detectedToken" class="detail-item">
            <span class="detail-label">Token:</span>
            <span class="detail-value token">{{ registrationResult.detectedToken.substring(0, 20) }}...</span>
          </div>
        </div>

        <button @click="resetForm" class="btn btn-primary">
          Create Another Account
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.header {
  padding: 2.5rem 2rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.form-container,
.otp-container,
.success-container {
  padding: 2rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
  background: white;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-error {
  border-color: #ef4444;
}

.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-otp {
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  font-weight: 600;
  padding: 1rem;
}

.error-text {
  font-size: 0.875rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

.btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-link {
  background: transparent;
  color: #667eea;
  margin-top: 1rem;
  padding: 0.5rem;
  font-weight: 500;
}

.btn-link:hover {
  color: #764ba2;
  background: #f3f4f6;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  text-align: center;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.otp-header {
  text-align: center;
  margin-bottom: 2rem;
}

.otp-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 1rem 0 0.5rem;
}

.otp-description {
  color: #6b7280;
  font-size: 0.9375rem;
  margin: 0;
}

.otp-description strong {
  color: #111827;
  font-weight: 600;
}

.otp-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.success-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.success-icon.large {
  width: 5rem;
  height: 5rem;
  font-size: 2.5rem;
}

.success-container {
  text-align: center;
  padding: 3rem 2rem;
}

.success-container h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem;
}

.success-message {
  color: #6b7280;
  font-size: 1rem;
  margin: 0 0 2rem;
}

.account-details {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-value {
  color: #111827;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}

.detail-value.token {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #667eea;
}

/* Responsive Design */
@media (max-width: 640px) {
  .app-container {
    padding: 0.5rem;
  }

  .header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 0.9375rem;
  }

  .form-container,
  .otp-container,
  .success-container {
    padding: 1.5rem;
  }

  .input {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .input-otp {
    font-size: 1.25rem;
    letter-spacing: 0.25rem;
  }

  .success-icon {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.75rem;
  }

  .success-icon.large {
    width: 4.5rem;
    height: 4.5rem;
    font-size: 2rem;
  }

  .success-container h2 {
    font-size: 1.5rem;
  }

  .account-details {
    padding: 1rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-value {
    max-width: 100%;
    text-align: left;
  }
}

@media (max-width: 400px) {
  .title {
    font-size: 1.5rem;
  }

  .form-container,
  .otp-container,
  .success-container {
    padding: 1.25rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .card {
    background: #1f2937;
  }

  label {
    color: #e5e7eb;
  }

  .input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .input:focus {
    border-color: #667eea;
    background: #374151;
  }

  .input:disabled {
    background: #1f2937;
  }

  .otp-header h2 {
    color: #f9fafb;
  }

  .otp-description {
    color: #9ca3af;
  }

  .otp-description strong {
    color: #f9fafb;
  }

  .success-container h2 {
    color: #f9fafb;
  }

  .success-message {
    color: #9ca3af;
  }

  .account-details {
    background: #374151;
  }

  .detail-label {
    color: #9ca3af;
  }

  .detail-value {
    color: #f9fafb;
  }

  .alert-error {
    background: #7f1d1d;
    color: #fecaca;
    border-color: #991b1b;
  }

  .alert-success {
    background: #064e3b;
    color: #a7f3d0;
    border-color: #065f46;
  }
}
</style>
