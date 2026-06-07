// ===================================================
// Auth Context — Firebase Authentication
// ===================================================

import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider, db } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'

const AuthContext = createContext(null)

// Admin email — this account gets admin privileges automatically
const ADMIN_EMAIL = 'ruebudu69@gmail.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Load user profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data())
          }
        } catch (err) {
          console.error('Error loading profile:', err)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Validate a license key
  const validateLicenseKey = async (key) => {
    try {
      setError(null)
      const normalizedKey = key.trim().toUpperCase()

      // Look for the key in Firestore
      const keysRef = collection(db, 'licenseKeys')
      const q = query(keysRef, where('key', '==', normalizedKey))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        throw new Error('Clé invalide. Vérifiez votre saisie.')
      }

      const keyDoc = snapshot.docs[0]
      const keyData = keyDoc.data()

      if (keyData.used) {
        throw new Error('Cette clé a déjà été utilisée.')
      }

      return { valid: true, keyDocId: keyDoc.id }
    } catch (err) {
      setError(err.message)
      return { valid: false, error: err.message }
    }
  }

  // Sign in with Google (after key validation)
  const signInWithGoogle = async (keyDocId = null) => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Check if user already has a profile
      const profileRef = doc(db, 'users', firebaseUser.uid)
      const profileDoc = await getDoc(profileRef)

      if (!profileDoc.exists()) {
        // New user — create profile
        if (!keyDocId) {
          // No valid key provided for new user
          await signOut(auth)
          setError("Vous avez besoin d'une clé de licence pour créer un compte.")
          return false
        }

        // Create user profile
        const profile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Joueur',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date().toISOString(),
          licenseKey: keyDocId,
          isAdmin: firebaseUser.email === ADMIN_EMAIL,
        }

        await setDoc(profileRef, profile)
        setUserProfile(profile)

        // Mark key as used
        await updateDoc(doc(db, 'licenseKeys', keyDocId), {
          used: true,
          usedBy: firebaseUser.uid,
          usedAt: new Date().toISOString(),
        })
      } else {
        setUserProfile(profileDoc.data())
      }

      return true
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Erreur de connexion. Réessayez.')
      return false
    }
  }

  // Sign in existing user (no key needed)
  const signInExistingUser = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Check if user has a profile
      const profileRef = doc(db, 'users', firebaseUser.uid)
      const profileDoc = await getDoc(profileRef)

      if (!profileDoc.exists()) {
        // Auto-create admin profile if it's the admin email
        if (firebaseUser.email === ADMIN_EMAIL) {
          const profile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Admin',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
            licenseKey: null,
            isAdmin: true,
          }
          await setDoc(profileRef, profile)
          setUserProfile(profile)
          return true
        }

        await signOut(auth)
        setError("Aucun compte trouvé. Vous avez besoin d'une clé de licence.")
        return false
      }

      setUserProfile(profileDoc.data())
      return true
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Erreur de connexion. Réessayez.')
      return false
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    error,
    setError,
    validateLicenseKey,
    signInWithGoogle,
    signInExistingUser,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
