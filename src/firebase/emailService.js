import { db, initAuth } from './config.js'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

/**
 * Checks if an email already exists in Firestore
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} - True if email exists, false otherwise
 */
export async function checkEmailExists(email) {
  try {
    // Ensure user is authenticated before reading
    await initAuth()
    
    const emailLower = email.trim().toLowerCase()
    const q = query(
      collection(db, 'accounts'),
      where('email', '==', emailLower)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking email existence:', error)
    throw error
  }
}

/**
 * Saves an email address to Firestore
 * @param {string} email - The email address to save
 * @param {object} additionalData - Optional additional data to store (e.g., registration result, token, etc.)
 * @returns {Promise<string>} - The ID of the created document
 */
export async function saveEmailToFirestore(email, additionalData = {}) {
  try {
    // Ensure user is authenticated before writing
    await initAuth()
    
    const docRef = await addDoc(collection(db, 'accounts'), {
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      ...additionalData
    })
    console.log('Email saved to Firestore with ID: ', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error saving email to Firestore: ', error)
    throw error
  }
}
