<script setup>
import { ref } from 'vue'

const email = ref('')
const account = ref(null)
const loading = ref(false)
const error = ref('')

function validateEmail(value) {
  // RFC 5322 Official Standard regex for email validation (covers most cases)
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
}

// Example API call helpers
async function createAccountAPI(email) {
  const response = await fetch('https://api.example.com/generate-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!response.ok) throw new Error('Account creation failed')
  return await response.json()
}

async function verifyEmailAPI(email) {
  // Example: call another API to verify email
  const response = await fetch('https://api.example.com/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!response.ok) throw new Error('Email verification failed')
  return await response.json()
}

// Main orchestrator
async function generateAccount() {
  error.value = ''
  account.value = null
  if (!validateEmail(email.value)) {
    error.value = 'Please enter a valid email address.'
    return
  }
  loading.value = true
  try {
    // Step 1: Verify email
    const verifyResult = await verifyEmailAPI(email.value)
    if (!verifyResult.valid) throw new Error('Email is not valid for account creation')
    // Step 2: Create account
    const accountResult = await createAccountAPI(email.value)
    account.value = accountResult
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <header>
      <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="90" height="90" />
      <h1>Account Generator</h1>
    </header>
    <main>
      <form class="form" @submit.prevent="generateAccount">
        <label for="email">Email Address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Enter your email"
          autocomplete="email"
          :disabled="loading"
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Generating...' : 'Generate Account' }}
        </button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="account" class="result">
        <h2>Generated Account</h2>
        <pre>{{ account }}</pre>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
header {
  text-align: center;
  margin-bottom: 2rem;
}
.logo {
  display: block;
  margin: 0 auto 1rem;
}
h1 {
  font-size: 1.7rem;
  font-weight: 600;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
label {
  font-size: 1rem;
  font-weight: 500;
}
input[type="email"] {
  padding: 0.7rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
button {
  padding: 0.7rem;
  font-size: 1rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
button:disabled {
  background: #b2dfdb;
  cursor: not-allowed;
}
.error {
  color: #d32f2f;
  margin-top: 1rem;
  text-align: center;
}
.result {
  margin-top: 2rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  word-break: break-word;
}
@media (max-width: 600px) {
  .container {
    padding: 1rem 0.5rem;
  }
  .form {
    padding: 1rem;
  }
  h1 {
    font-size: 1.2rem;
  }
}
</style>
