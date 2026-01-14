import { db } from './config.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Saves an email address to Firestore
 * @param {string} email - The email address to save
 * @param {object} additionalData - Optional additional data to store (e.g., registration result, token, etc.)
 * @returns {Promise<string>} - The ID of the created document
 */
export async function saveEmailToFirestore(email, additionalData = {}) {
  try {
    const docRef = await addDoc(collection(db, 'emails'), {
      email: email,
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
