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

/**
 * Checks if a phone number already exists in Firestore
 * @param {string} phoneNumber - The phone number to check
 * @returns {Promise<boolean>} - True if phone number exists, false otherwise
 */
export async function checkPhoneNumberExists(phoneNumber) {
  try {
    // Ensure user is authenticated before reading
    await initAuth()
    
    const phoneNumberTrimmed = phoneNumber.trim()
    const q = query(
      collection(db, 'accounts'),
      where('newPhoneNumber', '==', phoneNumberTrimmed)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error('Error checking phone number existence:', error)
    throw error
  }
}

/**
 * Saves a phone number to Firestore (updates existing account or creates new entry)
 * @param {string} email - The email address associated with the phone number
 * @param {string} phoneNumber - The phone number to save
 * @param {object} additionalData - Optional additional data to store
 * @returns {Promise<string>} - The ID of the created/updated document
 */
export async function savePhoneNumberToFirestore(email, phoneNumber, additionalData = {}) {
  try {
    // Ensure user is authenticated before writing
    await initAuth()
    
    const docRef = await addDoc(collection(db, 'accounts'), {
      email: email.trim().toLowerCase(),
      newPhoneNumber: phoneNumber.trim(),
      phoneNumberUpdatedAt: serverTimestamp(),
      ...additionalData
    })
    console.log('Phone number saved to Firestore with ID: ', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error saving phone number to Firestore: ', error)
    throw error
  }
}
