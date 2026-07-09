// ===================================================
// FriendsList — Add and view friends
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore'
import { formatNumber } from '../../data/upgrades'

export default function FriendsList() {
  const { user, userProfile } = useAuth()
  const [friends, setFriends] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchError, setSearchError] = useState(null)
  const [searchSuccess, setSearchSuccess] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load friends list
  useEffect(() => {
    if (!user) return

    const loadFriends = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        const friendIds = profileDoc.data()?.friends || []

        const friendsData = []
        for (const fid of friendIds) {
          const friendProfile = await getDoc(doc(db, 'users', fid))
          const friendSave = await getDoc(doc(db, 'saves', fid))

          if (friendProfile.exists()) {
            friendsData.push({
              uid: fid,
              ...friendProfile.data(),
              totalHoney: friendSave.exists() ? friendSave.data().totalHoney || 0 : 0,
              honeyPerSecond: friendSave.exists() ? friendSave.data().honeyPerSecond || 0 : 0,
            })
          }
        }

        setFriends(friendsData)
      } catch (err) {
        console.error('Error loading friends:', err)
      }
      setLoading(false)
    }

    loadFriends()
  }, [user])

  const handleAddFriend = async () => {
    if (!searchName.trim()) return
    setSearchError(null)
    setSearchSuccess(null)

    try {
      // Search by display name
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('displayName', '==', searchName.trim()))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setSearchError('Joueur introuvable.')
        return
      }

      const friendDoc = snapshot.docs[0]
      if (friendDoc.id === user.uid) {
        setSearchError('Vous ne pouvez pas vous ajouter vous-même !')
        return
      }

      // Add friend to current user's friend list
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(friendDoc.id)
      })

      setSearchSuccess(`${searchName} ajouté(e) comme ami(e) !`)
      setSearchName('')

      // Refresh friends
      setFriends(prev => [...prev, {
        uid: friendDoc.id,
        ...friendDoc.data(),
        totalHoney: 0,
        honeyPerSecond: 0,
      }])
    } catch (err) {
      console.error('Error adding friend:', err)
      setSearchError('Erreur lors de l\'ajout.')
    }
  }

  return (
    <div className="friends-container">
      <div className="mc-panel" style={{ marginBottom: '16px' }}>
        <h2>👥 AMIS</h2>
        <p style={{ textAlign: 'center', fontSize: '8px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Chaque ami vous donne +1% de production de miel (maximum +10%). 
          Bonus actuel : <strong style={{ color: 'var(--text-honey)' }}>+{Math.min(userProfile?.friends?.length || 0, 10)}%</strong>
        </p>

        {/* Add friend */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            className="friend-add-input"
            placeholder="Nom du joueur..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
            id="friend-search-input"
          />
          <button
            className="mc-button primary"
            onClick={handleAddFriend}
            style={{ width: '100%' }}
            id="btn-add-friend"
          >
            ➕ Ajouter un ami
          </button>
          {searchError && <div className="license-error">{searchError}</div>}
          {searchSuccess && <div className="license-success">{searchSuccess}</div>}
        </div>

        {/* Friends list */}
        {loading && <div className="loading-text" style={{ textAlign: 'center' }}>Chargement...</div>}

        {!loading && friends.length === 0 && (
          <div className="loading-text" style={{ textAlign: 'center' }}>
            Aucun ami pour l'instant. Ajoutez-en un !
          </div>
        )}

        {!loading && friends.map(friend => (
          <div className="friend-entry" key={friend.uid}>
            {friend.photoURL && (
              <img src={friend.photoURL} alt="" className="friend-avatar" />
            )}
            <div className="friend-info">
              <div className="friend-name">{friend.displayName}</div>
              <div className="friend-honey">
                🍯 {formatNumber(friend.totalHoney)} total · +{formatNumber(friend.honeyPerSecond)}/sec
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
