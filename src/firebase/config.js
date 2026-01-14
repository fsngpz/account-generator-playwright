import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Your web app's Firebase configuration
// TODO: Replace these values with your Firebase project configuration
// You can find these in Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCh8vMiBWZ9J2DuMNzsvpUD_k-YBF7EbEQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pyng-ab04f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pyng-ab04f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pyng-ab04f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '501525627023',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:501525627023:web:defcd17747c094f293f0fa'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app)

// Initialize Firebase Authentication
const auth = getAuth(app)

// Initialize anonymous authentication
let authPromise = null
const initAuth = async () => {
  // Return existing promise if auth is already in progress
  if (authPromise) return authPromise
  
  authPromise = (async () => {
    try {
      // Check if user is already signed in
      if (auth.currentUser) {
        return auth.currentUser
      }
      
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth)
      console.log('Signed in anonymously:', userCredential.user.uid)
      return userCredential.user
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      authPromise = null // Reset on error
      throw error
    }
  })()
  
  return authPromise
}

export { db, auth, initAuth }
