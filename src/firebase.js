// ===================================================
// Firebase Configuration
// ===================================================

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBldu3jdgTxeBEx1hfMQVBEMiJUS20j278",
  authDomain: "bee-clicker-831fe.firebaseapp.com",
  projectId: "bee-clicker-831fe",
  storageBucket: "bee-clicker-831fe.firebasestorage.app",
  messagingSenderId: "190213438040",
  appId: "1:190213438040:web:90e7816ff296b0a2a4682d"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export default app
