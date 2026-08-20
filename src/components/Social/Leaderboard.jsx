// ===================================================
// Leaderboard — Top players ranking (with Friends filter)
// ===================================================

import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { formatNumber } from '../../data/upgrades'
import { useAuth } from '../../contexts/AuthContext'

export default function Leaderboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('global') // 'global' or 'friends'
  const [friendIds, setFriendIds] = useState([])

  // Load friend IDs
  useEffect(() => {
    if (!user) return
    const loadFriends = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        const friends = profileDoc.data()?.friends || []
        setFriendIds([...friends, user.uid]) // include self in friends leaderboard
      } catch (err) {
        console.error('Error loading friends for leaderboard:', err)
      }
    }
    loadFriends()
  }, [user])

  useEffect(() => {
    const savesRef = collection(db, 'saves')
    const q = query(savesRef, orderBy('totalHoney', 'desc'), limit(50))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        // Fetch users to get display names and PFPs
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        const usersMap = {}
        usersSnapshot.forEach(doc => {
          usersMap[doc.id] = doc.data()
        })

        const results = []
        snapshot.forEach(doc => {
          const data = doc.data()
          const user = usersMap[doc.id]
          results.push({
            uid: doc.id,
            displayName: user?.displayName || 'Joueur inconnu',
            photoURL: user?.photoURL || null,
            totalHoney: data.totalHoney || 0,
            honeyPerSecond: data.honeyPerSecond || 0,
            royalJelly: data.royalJelly || 0,
          })
        })

        setEntries(results)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const getRankClass = (index) => {
    if (index === 0) return 'gold'
    if (index === 1) return 'silver'
    if (index === 2) return 'bronze'
    return ''
  }

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  // Filter entries based on tab
  const filteredEntries = filter === 'friends'
    ? entries.filter(e => friendIds.includes(e.uid))
    : entries

  return (
    <div className="leaderboard-container">
      <div className="mc-panel" style={{ marginBottom: '16px' }}>
        <h2>🏆 CLASSEMENT</h2>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '3px solid var(--mc-border-dark)' }}>
          <button
            className={`shop-tab ${filter === 'global' ? 'active' : ''}`}
            onClick={() => setFilter('global')}
            style={{ flex: 1 }}
          >
            🌍 Mondial
          </button>
          <button
            className={`shop-tab ${filter === 'friends' ? 'active' : ''}`}
            onClick={() => setFilter('friends')}
            style={{ flex: 1 }}
          >
            👥 Entre Amis
          </button>
        </div>

        {loading && <div className="loading-text" style={{ textAlign: 'center' }}>Chargement...</div>}

        {!loading && filteredEntries.length === 0 && (
          <div className="loading-text" style={{ textAlign: 'center' }}>
            {filter === 'friends' ? "Aucun ami dans le classement. Ajoutez des amis !" : "Aucun joueur pour l'instant."}
          </div>
        )}

        {!loading && filteredEntries.map((entry, index) => (
          <div className="leaderboard-entry" key={entry.uid} id={`leaderboard-${index}`}>
            <div className={`leaderboard-rank ${getRankClass(index)}`}>
              {getRankEmoji(index)}
            </div>
            {entry.photoURL && (
              <img src={entry.photoURL} alt="" className="friend-avatar" />
            )}
            <div className="leaderboard-name">
              {entry.displayName}
              {entry.royalJelly > 0 && (
                <span style={{ fontSize: '7px', color: 'var(--text-dim)', marginLeft: '6px' }}>
                  👑{entry.royalJelly}
                </span>
              )}
            </div>
            <div className="leaderboard-score">
              🍯 {formatNumber(entry.totalHoney)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
