// ===================================================
// Leaderboard — Top players ranking
// ===================================================

import React, { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { formatNumber } from '../../data/upgrades'

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="leaderboard-container">
      <div className="mc-panel" style={{ marginBottom: '16px' }}>
        <h2>🏆 CLASSEMENT</h2>

        {loading && <div className="loading-text" style={{ textAlign: 'center' }}>Chargement...</div>}

        {!loading && entries.length === 0 && (
          <div className="loading-text" style={{ textAlign: 'center' }}>
            Aucun joueur pour l'instant. Soyez le premier !
          </div>
        )}

        {!loading && entries.map((entry, index) => (
          <div className="leaderboard-entry" key={entry.uid} id={`leaderboard-${index}`}>
            <div className={`leaderboard-rank ${getRankClass(index)}`}>
              {getRankEmoji(index)}
            </div>
            {entry.photoURL && (
              <img src={entry.photoURL} alt="" className="friend-avatar" />
            )}
            <div className="leaderboard-name">{entry.displayName}</div>
            <div className="leaderboard-score">
              🍯 {formatNumber(entry.totalHoney)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
