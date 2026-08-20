// ===================================================
// FriendsList — Complete social hub (v2)
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGame } from '../../contexts/GameContext'
import { db } from '../../firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore'
import { formatNumber, PRODUCTION_UPGRADES } from '../../data/upgrades'
import { ACHIEVEMENTS } from '../../data/achievements'

export default function FriendsList() {
  const { user, userProfile } = useAuth()
  const gameState = useGame()
  const [friends, setFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchError, setSearchError] = useState(null)
  const [searchSuccess, setSearchSuccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends') // friends, requests, gifts
  const [visitingFriend, setVisitingFriend] = useState(null) // modal
  const [giftSentToday, setGiftSentToday] = useState({}) // { friendUid: true }

  // Load friends, requests, gifts
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        const profileData = profileDoc.data() || {}
        const friendIds = profileData.friends || []
        const receivedRequests = profileData.friendRequestsReceived || []
        const sentRequests = profileData.friendRequestsSent || []
        const giftsSent = profileData.giftsSentToday || {}

        // Load friends data
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
              royalJelly: friendSave.exists() ? friendSave.data().royalJelly || 0 : 0,
              totalClicks: friendSave.exists() ? friendSave.data().totalClicks || 0 : 0,
              playTime: friendSave.exists() ? friendSave.data().playTime || 0 : 0,
              upgrades: friendSave.exists() ? friendSave.data().upgrades || {} : {},
              achievements: friendSave.exists() ? friendSave.data().achievements || [] : [],
            })
          }
        }

        // Load received requests data
        const receivedData = []
        for (const req of receivedRequests) {
          const reqProfile = await getDoc(doc(db, 'users', req.fromUid || req))
          if (reqProfile.exists()) {
            receivedData.push({
              uid: req.fromUid || req,
              ...reqProfile.data(),
              sentAt: req.sentAt || null,
            })
          }
        }

        // Load sent requests
        const sentData = []
        for (const req of sentRequests) {
          const reqProfile = await getDoc(doc(db, 'users', req.toUid || req))
          if (reqProfile.exists()) {
            sentData.push({
              uid: req.toUid || req,
              ...reqProfile.data(),
              sentAt: req.sentAt || null,
            })
          }
        }

        // Check today's gifts
        const today = new Date().toISOString().slice(0, 10)
        const todayGifts = {}
        if (giftsSent && giftsSent.date === today) {
          (giftsSent.recipients || []).forEach(uid => {
            todayGifts[uid] = true
          })
        }

        setFriends(friendsData)
        setPendingReceived(receivedData)
        setPendingSent(sentData)
        setGiftSentToday(todayGifts)
      } catch (err) {
        console.error('Error loading friends:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [user])

  // --- Send Friend Request ---
  const handleSendRequest = async () => {
    if (!searchName.trim()) return
    setSearchError(null)
    setSearchSuccess(null)

    try {
      // Case-insensitive search
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      
      let foundDoc = null
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        if (data.displayName && data.displayName.toLowerCase() === searchName.trim().toLowerCase()) {
          foundDoc = { id: docSnap.id, ...data }
        }
      })

      if (!foundDoc) {
        setSearchError('Joueur introuvable.')
        return
      }

      if (foundDoc.id === user.uid) {
        setSearchError('Vous ne pouvez pas vous ajouter vous-même !')
        return
      }

      // Check if already friends
      const myProfile = await getDoc(doc(db, 'users', user.uid))
      const myFriends = myProfile.data()?.friends || []
      if (myFriends.includes(foundDoc.id)) {
        setSearchError('Ce joueur est déjà votre ami !')
        return
      }

      // Check if request already sent
      const mySent = myProfile.data()?.friendRequestsSent || []
      if (mySent.some(r => (r.toUid || r) === foundDoc.id)) {
        setSearchError('Demande déjà envoyée !')
        return
      }

      const now = new Date().toISOString()

      // Add to my sent requests
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequestsSent: arrayUnion({
          toUid: foundDoc.id,
          toName: foundDoc.displayName,
          sentAt: now,
        })
      })

      // Add to their received requests
      await updateDoc(doc(db, 'users', foundDoc.id), {
        friendRequestsReceived: arrayUnion({
          fromUid: user.uid,
          fromName: userProfile?.displayName || 'Joueur',
          fromPhoto: userProfile?.photoURL || null,
          sentAt: now,
        })
      })

      setSearchSuccess(`Demande envoyée à ${foundDoc.displayName} !`)
      setSearchName('')
      setPendingSent(prev => [...prev, { uid: foundDoc.id, displayName: foundDoc.displayName, photoURL: foundDoc.photoURL, sentAt: now }])
    } catch (err) {
      console.error('Error sending friend request:', err)
      setSearchError("Erreur lors de l'envoi de la demande.")
    }
  }

  // --- Accept Friend Request ---
  const handleAcceptRequest = async (requester) => {
    try {
      const now = new Date().toISOString()

      // Add each other as friends
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(requester.uid),
      })
      await updateDoc(doc(db, 'users', requester.uid), {
        friends: arrayUnion(user.uid),
      })

      // Remove from pending requests on both sides
      // Remove from my received
      const myDoc = await getDoc(doc(db, 'users', user.uid))
      const myReceived = myDoc.data()?.friendRequestsReceived || []
      const updatedReceived = myReceived.filter(r => (r.fromUid || r) !== requester.uid)
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequestsReceived: updatedReceived,
      })

      // Remove from their sent
      const theirDoc = await getDoc(doc(db, 'users', requester.uid))
      const theirSent = theirDoc.data()?.friendRequestsSent || []
      const updatedSent = theirSent.filter(r => (r.toUid || r) !== user.uid)
      await updateDoc(doc(db, 'users', requester.uid), {
        friendRequestsSent: updatedSent,
      })

      // Update local state
      setPendingReceived(prev => prev.filter(r => r.uid !== requester.uid))
      setFriends(prev => [...prev, { ...requester, totalHoney: 0, honeyPerSecond: 0 }])

      // Toast
      window.dispatchEvent(new CustomEvent('system_toast', {
        detail: { type: 'success', title: 'Ami ajouté !', message: `${requester.displayName} est maintenant votre ami.` }
      }))
    } catch (err) {
      console.error('Error accepting request:', err)
    }
  }

  // --- Reject Friend Request ---
  const handleRejectRequest = async (requester) => {
    try {
      // Remove from my received
      const myDoc = await getDoc(doc(db, 'users', user.uid))
      const myReceived = myDoc.data()?.friendRequestsReceived || []
      const updatedReceived = myReceived.filter(r => (r.fromUid || r) !== requester.uid)
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequestsReceived: updatedReceived,
      })

      // Remove from their sent
      const theirDoc = await getDoc(doc(db, 'users', requester.uid))
      const theirSent = theirDoc.data()?.friendRequestsSent || []
      const updatedSent = theirSent.filter(r => (r.toUid || r) !== user.uid)
      await updateDoc(doc(db, 'users', requester.uid), {
        friendRequestsSent: updatedSent,
      })

      setPendingReceived(prev => prev.filter(r => r.uid !== requester.uid))
    } catch (err) {
      console.error('Error rejecting request:', err)
    }
  }

  // --- Remove Friend ---
  const handleRemoveFriend = async (friendUid) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayRemove(friendUid)
      })
      await updateDoc(doc(db, 'users', friendUid), {
        friends: arrayRemove(user.uid)
      })
      setFriends(prev => prev.filter(f => f.uid !== friendUid))
      
      window.dispatchEvent(new CustomEvent('system_toast', {
        detail: { type: 'success', title: 'Ami retiré', message: 'Le joueur a été retiré de votre liste.' }
      }))
    } catch (err) {
      console.error('Error removing friend:', err)
    }
  }

  // --- Send Gift ---
  const handleSendGift = async (friend) => {
    if (giftSentToday[friend.uid]) return
    
    try {
      const today = new Date().toISOString().slice(0, 10)
      
      // Update recipient's pending gifts in their save
      const friendSaveRef = doc(db, 'saves', friend.uid)
      const friendSaveDoc = await getDoc(friendSaveRef)
      const existingGifts = friendSaveDoc.exists() ? (friendSaveDoc.data().pendingGifts || []) : []
      
      const gift = {
        fromUid: user.uid,
        fromName: userProfile?.displayName || 'Ami',
        type: 'nectar',
        amount: 0, // will be calculated based on recipient's HPS
        sentAt: new Date().toISOString(),
      }
      
      await updateDoc(friendSaveRef, {
        pendingGifts: [...existingGifts, gift]
      })

      // Track that we sent a gift today
      const myDoc = await getDoc(doc(db, 'users', user.uid))
      const currentGiftData = myDoc.data()?.giftsSentToday || {}
      const recipients = currentGiftData.date === today ? [...(currentGiftData.recipients || []), friend.uid] : [friend.uid]
      
      await updateDoc(doc(db, 'users', user.uid), {
        giftsSentToday: { date: today, recipients }
      })

      setGiftSentToday(prev => ({ ...prev, [friend.uid]: true }))

      window.dispatchEvent(new CustomEvent('system_toast', {
        detail: { type: 'success', title: '🎁 Cadeau envoyé !', message: `Un Pot de Nectar a été envoyé à ${friend.displayName} !` }
      }))
    } catch (err) {
      console.error('Error sending gift:', err)
    }
  }

  // --- Claim Gift ---
  const handleClaimGift = (index) => {
    gameState.dispatch({ type: 'CLAIM_GIFT', giftIndex: index })
    window.dispatchEvent(new CustomEvent('system_toast', {
      detail: { type: 'success', title: '🎁 Cadeau réclamé !', message: 'Le Pot de Nectar a été ajouté à votre miel !' }
    }))
  }

  // Format play time
  const formatTime = (seconds) => {
    if (!seconds) return '0h'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const pendingGifts = gameState.pendingGifts || []

  return (
    <div className="friends-container">
      <div className="mc-panel" style={{ marginBottom: '16px' }}>
        <h2>👥 AMIS & SOCIAL</h2>
        <p style={{ textAlign: 'center', fontSize: '8px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Chaque ami = +1% de production (max +10%).
          Bonus actuel : <strong style={{ color: 'var(--text-honey)' }}>+{Math.min(friends.length, 10)}%</strong>
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '3px solid var(--mc-border-dark)' }}>
          <button
            className={`shop-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
            style={{ flex: 1 }}
          >
            👥 Amis ({friends.length})
          </button>
          <button
            className={`shop-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{ flex: 1, position: 'relative' }}
          >
            📬 Demandes
            {pendingReceived.length > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '6px',
                background: 'var(--cannot-afford)', color: '#fff',
                borderRadius: '50%', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', fontWeight: 'bold',
              }}>
                {pendingReceived.length}
              </span>
            )}
          </button>
          <button
            className={`shop-tab ${activeTab === 'gifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('gifts')}
            style={{ flex: 1, position: 'relative' }}
          >
            🎁 Cadeaux
            {pendingGifts.length > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '6px',
                background: 'var(--honey)', color: '#000',
                borderRadius: '50%', width: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', fontWeight: 'bold',
              }}>
                {pendingGifts.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB: Friends List */}
        {activeTab === 'friends' && (
          <>
            {/* Add friend search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="friend-add-input"
                placeholder="Rechercher un joueur..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                id="friend-search-input"
              />
              <button
                className="mc-button primary"
                onClick={handleSendRequest}
                style={{ width: '100%' }}
                id="btn-add-friend"
              >
                📩 Envoyer une demande d'ami
              </button>
              {searchError && <div className="license-error">{searchError}</div>}
              {searchSuccess && <div className="license-success">{searchSuccess}</div>}
            </div>

            {loading && <div className="loading-text" style={{ textAlign: 'center' }}>Chargement...</div>}

            {!loading && friends.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center' }}>
                Aucun ami pour l'instant. Envoyez une demande !
              </div>
            )}

            {!loading && friends.map(friend => (
              <div className="friend-entry" key={friend.uid} style={{ position: 'relative' }}>
                {friend.photoURL && (
                  <img src={friend.photoURL} alt="" className="friend-avatar" />
                )}
                <div className="friend-info" style={{ cursor: 'pointer' }} onClick={() => setVisitingFriend(friend)}>
                  <div className="friend-name">{friend.displayName}</div>
                  <div className="friend-honey">
                    🍯 {formatNumber(friend.totalHoney)} total · +{formatNumber(friend.honeyPerSecond)}/sec
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    className="mc-button"
                    style={{ padding: '6px 8px', fontSize: '7px' }}
                    onClick={() => setVisitingFriend(friend)}
                    title="Visiter la ruche"
                  >
                    🏠
                  </button>
                  <button
                    className={`mc-button ${giftSentToday[friend.uid] ? '' : 'primary'}`}
                    style={{ padding: '6px 8px', fontSize: '7px' }}
                    onClick={() => handleSendGift(friend)}
                    disabled={giftSentToday[friend.uid]}
                    title={giftSentToday[friend.uid] ? 'Cadeau déjà envoyé aujourd\'hui' : 'Envoyer un cadeau'}
                  >
                    {giftSentToday[friend.uid] ? '✅' : '🎁'}
                  </button>
                  <button
                    className="mc-button danger"
                    style={{ padding: '6px 8px', fontSize: '7px' }}
                    onClick={() => handleRemoveFriend(friend.uid)}
                    title="Retirer de la liste d'amis"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB: Friend Requests */}
        {activeTab === 'requests' && (
          <>
            {/* Received */}
            <h3 style={{ fontSize: '9px', color: 'var(--text-honey)', marginBottom: '10px' }}>📥 Demandes Reçues</h3>
            {pendingReceived.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center', marginBottom: '16px' }}>Aucune demande en attente.</div>
            )}
            {pendingReceived.map(req => (
              <div className="friend-entry" key={req.uid} style={{ marginBottom: '4px' }}>
                {req.photoURL && <img src={req.photoURL} alt="" className="friend-avatar" />}
                <div className="friend-info">
                  <div className="friend-name">{req.displayName}</div>
                  <div className="friend-honey" style={{ fontSize: '7px' }}>
                    Souhaite devenir votre ami
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    className="mc-button primary"
                    style={{ padding: '6px 10px', fontSize: '7px' }}
                    onClick={() => handleAcceptRequest(req)}
                  >
                    ✓
                  </button>
                  <button
                    className="mc-button danger"
                    style={{ padding: '6px 10px', fontSize: '7px' }}
                    onClick={() => handleRejectRequest(req)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Sent */}
            <h3 style={{ fontSize: '9px', color: 'var(--text-honey)', marginTop: '20px', marginBottom: '10px' }}>📤 Demandes Envoyées</h3>
            {pendingSent.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center' }}>Aucune demande envoyée.</div>
            )}
            {pendingSent.map(req => (
              <div className="friend-entry" key={req.uid} style={{ opacity: 0.6 }}>
                {req.photoURL && <img src={req.photoURL} alt="" className="friend-avatar" />}
                <div className="friend-info">
                  <div className="friend-name">{req.displayName}</div>
                  <div className="friend-honey" style={{ fontSize: '7px', color: 'var(--text-dim)' }}>
                    ⏳ En attente d'acceptation...
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB: Gifts */}
        {activeTab === 'gifts' && (
          <>
            <h3 style={{ fontSize: '9px', color: 'var(--text-honey)', marginBottom: '10px' }}>🎁 Cadeaux Reçus</h3>
            {pendingGifts.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center' }}>
                Aucun cadeau en attente. Vos amis peuvent vous envoyer des Pots de Nectar !
              </div>
            )}
            {pendingGifts.map((gift, index) => (
              <div className="friend-entry" key={index} style={{ borderColor: 'var(--honey-dark)' }}>
                <div className="upgrade-icon" style={{ fontSize: '20px' }}>🍯</div>
                <div className="friend-info">
                  <div className="friend-name">Pot de Nectar</div>
                  <div className="friend-honey" style={{ fontSize: '7px' }}>
                    De : {gift.fromName} · {gift.type === 'nectar' ? '1 min de production' : 'Boost x10 30s'}
                  </div>
                </div>
                <button
                  className="mc-button primary"
                  style={{ padding: '8px 12px', fontSize: '8px', flexShrink: 0 }}
                  onClick={() => handleClaimGift(index)}
                >
                  Réclamer
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* --- Visit Friend Modal --- */}
      {visitingFriend && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setVisitingFriend(null)}
        >
          <div
            className="mc-panel"
            style={{ width: '500px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '12px' }}>🏠 Ruche de {visitingFriend.displayName}</h2>

            {/* Profile header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '2px solid var(--mc-border-dark)' }}>
              {visitingFriend.photoURL && (
                <img src={visitingFriend.photoURL} alt="" style={{ width: '48px', height: '48px', borderRadius: '4px', border: '2px solid var(--honey-dark)' }} />
              )}
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-honey)', marginBottom: '6px' }}>
                  {visitingFriend.displayName}
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                  🍯 Total : {formatNumber(visitingFriend.totalHoney)} · +{formatNumber(visitingFriend.honeyPerSecond)}/sec
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  👑 Gelée Royale : {visitingFriend.royalJelly || 0} · 🖱️ Clics : {(visitingFriend.totalClicks || 0).toLocaleString('fr-FR')}
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ⏱️ Temps de jeu : {formatTime(visitingFriend.playTime)}
                </div>
              </div>
            </div>

            {/* Buildings */}
            <h3 style={{ fontSize: '9px', color: 'var(--text-honey)', marginBottom: '10px' }}>🏗️ Bâtiments</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {Object.entries(visitingFriend.upgrades || {}).filter(([_, count]) => count > 0).map(([id, count]) => {
                const upgrade = PRODUCTION_UPGRADES.find(u => u.id === id)
                if (!upgrade) return null
                return (
                  <div key={id} style={{
                    padding: '6px 10px', background: 'var(--bg-panel-inner)',
                    border: '2px solid var(--mc-border-dark)', fontSize: '8px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ fontSize: '14px' }}>{upgrade.icon}</span>
                    <span>{upgrade.name}: <strong style={{ color: 'var(--text-honey)' }}>{count}</strong></span>
                  </div>
                )
              })}
              {Object.keys(visitingFriend.upgrades || {}).length === 0 && (
                <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>Aucun bâtiment</div>
              )}
            </div>

            {/* Achievements */}
            <h3 style={{ fontSize: '9px', color: 'var(--text-honey)', marginBottom: '10px' }}>
              🏆 Succès ({(visitingFriend.achievements || []).length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
              {(visitingFriend.achievements || []).map(achId => {
                const ach = ACHIEVEMENTS.find(a => a.id === achId)
                return ach ? (
                  <span key={achId} title={ach.name} style={{ fontSize: '16px', cursor: 'help' }}>{ach.icon}</span>
                ) : null
              })}
              {(visitingFriend.achievements || []).length === 0 && (
                <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>Aucun succès</div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`mc-button ${giftSentToday[visitingFriend.uid] ? '' : 'primary'}`}
                style={{ flex: 1 }}
                onClick={() => handleSendGift(visitingFriend)}
                disabled={giftSentToday[visitingFriend.uid]}
              >
                {giftSentToday[visitingFriend.uid] ? '✅ Cadeau envoyé' : '🎁 Envoyer un Pot de Nectar'}
              </button>
              <button
                className="mc-button"
                style={{ flex: 1 }}
                onClick={() => setVisitingFriend(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
