// ===================================================
// Auth Context — Firebase Authentication
// ===================================================

import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, googleProvider, db } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, linkWithPopup, updateProfile } from 'firebase/auth'
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

  // Sign up with Email/Password
  const signUpWithEmail = async (email, password, pseudo, keyDocId) => {
    try {
      setError(null)
      if (!keyDocId) {
        setError("Vous avez besoin d'une clé de licence pour créer un compte.")
        return false
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user

      // Create user profile
      const profile = {
        uid: firebaseUser.uid,
        displayName: pseudo || 'Joueur',
        email: firebaseUser.email,
        photoURL: null,
        createdAt: new Date().toISOString(),
        licenseKey: keyDocId,
        isAdmin: firebaseUser.email === ADMIN_EMAIL,
      }

      const profileRef = doc(db, 'users', firebaseUser.uid)
      await setDoc(profileRef, profile)
      setUserProfile(profile)

      // Mark key as used
      await updateDoc(doc(db, 'licenseKeys', keyDocId), {
        used: true,
        usedBy: firebaseUser.uid,
        usedAt: new Date().toISOString(),
      })

      return true
    } catch (err) {
      console.error('Email sign up error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé.')
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit faire au moins 6 caractères.')
      } else {
        setError('Erreur d\'inscription. Vérifiez vos informations.')
      }
      return false
    }
  }

  // Sign in with Email/Password
  const signInWithEmail = async (email, password) => {
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user

      // Check if user has a profile
      const profileRef = doc(db, 'users', firebaseUser.uid)
      const profileDoc = await getDoc(profileRef)

      if (!profileDoc.exists()) {
        // Auto-create admin profile if it's the admin email
        if (firebaseUser.email === ADMIN_EMAIL) {
          const profile = {
            uid: firebaseUser.uid,
            displayName: 'Admin',
            email: firebaseUser.email,
            photoURL: null,
            createdAt: new Date().toISOString(),
            licenseKey: null,
            isAdmin: true,
          }
          await setDoc(profileRef, profile)
          setUserProfile(profile)
          return true
        }

        await signOut(auth)
        setError("Aucun profil trouvé.")
        return false
      }

      setUserProfile(profileDoc.data())
      return true
    } catch (err) {
      console.error('Email sign in error:', err)
      setError('Email ou mot de passe incorrect.')
      return false
    }
  }

  // Update Profile Picture
  const updateUserProfilePicture = async (fileOrUrl) => {
    try {
      setError(null)
      if (!user) throw new Error("Non connecté.")

      let finalUrl = fileOrUrl
      
      // If it's a File object, compress and convert to Base64
      if (fileOrUrl instanceof File) {
        finalUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const MAX_SIZE = 128 // Small PFP to save DB space
              let width = img.width
              let height = img.height

              if (width > height) {
                if (width > MAX_SIZE) {
                  height *= MAX_SIZE / width
                  width = MAX_SIZE
                }
              } else {
                if (height > MAX_SIZE) {
                  width *= MAX_SIZE / height
                  height = MAX_SIZE
                }
              }

              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)
              
              // Compress to Base64 (WebP, 80% quality)
              resolve(canvas.toDataURL('image/webp', 0.8))
            }
            img.onerror = () => reject(new Error("Fichier image invalide."))
            img.src = e.target.result
          }
          reader.onerror = () => reject(new Error("Erreur de lecture du fichier."))
          reader.readAsDataURL(fileOrUrl)
        })
      }

      // Update Firestore
      const profileRef = doc(db, 'users', user.uid)
      await updateDoc(profileRef, { photoURL: finalUrl })

      // Update Firebase Auth Profile
      await updateProfile(user, { photoURL: finalUrl })

      setUserProfile(prev => ({ ...prev, photoURL: finalUrl }))
      return true
    } catch (err) {
      console.error('PFP update error:', err)
      setError('Erreur lors de la mise à jour de la photo.')
      return false
    }
  }

  // Reset Password
  const resetPassword = async (email) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Erreur lors de l\'envoi de l\'email de réinitialisation.')
      return false
    }
  }

  // Link Google Account
  const linkGoogleAccount = async () => {
    try {
      setError(null)
      if (!user) throw new Error("Non connecté.")
      await linkWithPopup(user, googleProvider)
      return true
    } catch (err) {
      console.error('Link Google error:', err)
      if (err.code === 'auth/credential-already-in-use') {
        setError('Ce compte Google est déjà lié à un autre compte.')
      } else {
        setError('Erreur lors de l\'association du compte Google.')
      }
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

  // --- Ban System ---
  const banUser = async (reason = "Utilisation d'un Auto-Clicker ou logiciel tiers détectée.") => {
    if (!user) return
    try {
      const profileRef = doc(db, 'users', user.uid)
      await updateDoc(profileRef, {
        isBanned: true,
        banReason: reason,
        bannedAt: new Date().toISOString(),
      })
      setUserProfile(prev => ({ ...prev, isBanned: true, banReason: reason }))
    } catch (err) {
      console.error('Ban error:', err)
    }
  }


  const unbanUserByEmail = async (targetEmail) => {
    try {
      setError(null)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', targetEmail))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        throw new Error('Utilisateur non trouvé avec cet email.')
      }

      const userDoc = snapshot.docs[0]
      await updateDoc(doc(db, 'users', userDoc.id), { isBanned: false })
      return true
    } catch (err) {
      console.error('Unban error:', err)
      setError(err.message || 'Erreur lors du débannissement.')
      return false
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
    signUpWithEmail,
    signInWithEmail,
    updateUserProfilePicture,
    resetPassword,
    linkGoogleAccount,
    logout,
    banUser,
    unbanUserByEmail,
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
