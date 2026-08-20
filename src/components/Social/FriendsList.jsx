// ===================================================
// FriendsList — Real-Time Social Hub with Self-Healing Sync
// ===================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGame } from '../../contexts/GameContext'
import { db } from '../../firebase'
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
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

  // Real-time listener on current user profile for instant updates
  useEffect(() => {
    if (!user) return

    const userDocRef = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false)
        return
      }

      try {
        const profileData = snapshot.data() || {}
        let friendIds = profileData.friends || []
        const rawReceived = profileData.friendRequestsReceived || []
        const rawSent = profileData.friendRequestsSent || []
        const giftsSent = profileData.giftsSentToday || {}

        // --- SELF-HEALING & MUTUAL ACCEPTANCE SYNC ---
        // Check if any sent request has already been accepted by the target user
        const confirmedNewFriends = []
        const stillPendingSent = []

        for (const req of rawSent) {
          const targetUid = req.toUid || req
          if (friendIds.includes(targetUid)) {
            continue // Already in friend list
          }

          try {
            const targetDoc = await getDoc(doc(db, 'users', targetUid))
            if (targetDoc.exists()) {
              const targetFriends = targetDoc.data()?.friends || []
              if (targetFriends.includes(user.uid)) {
                // The target user accepted! Add to our friends & clean up
                confirmedNewFriends.push(targetUid)
              } else {
                stillPendingSent.push({
                  uid: targetUid,
                  displayName: targetDoc.data()?.displayName || req.toName || 'Joueur',
                  photoURL: targetDoc.data()?.photoURL || null,
                  sentAt: req.sentAt || null,
                })
              }
            }
          } catch (e) {
            stillPendingSent.push({
              uid: targetUid,
              displayName: req.toName || 'Joueur',
              photoURL: null,
              sentAt: req.sentAt || null,
            })
          }
        }

        // If we found newly confirmed friends via target acceptance, auto-update our document
        if (confirmedNewFriends.length > 0) {
          const updatedFriends = Array.from(new Set([...friendIds, ...confirmedNewFriends]))
          const cleanedSent = rawSent.filter((r) => !confirmedNewFriends.includes(r.toUid || r))
          await updateDoc(userDocRef, {
            friends: updatedFriends,
            friendRequestsSent: cleanedSent,
          }).catch(console.error)
          friendIds = updatedFriends
        }

        // Load complete friend profiles & save stats
        const friendsData = []
        for (const fid of friendIds) {
          try {
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
          } catch (err) {
            console.error('Error fetching friend data for', fid, err)
          }
        }

        // Load received requests
        const receivedData = []
        for (const req of rawReceived) {
          const fromUid = req.fromUid || req
          if (friendIds.includes(fromUid)) continue // Already friend

          try {
            const reqProfile = await getDoc(doc(db, 'users', fromUid))
            if (reqProfile.exists()) {
              receivedData.push({
                uid: fromUid,
                ...reqProfile.data(),
                sentAt: req.sentAt || null,
              })
            }
          } catch (e) {
            receivedData.push({
              uid: fromUid,
              displayName: req.fromName || 'Joueur',
              photoURL: req.fromPhoto || null,
              sentAt: req.sentAt || null,
            })
          }
        }

        // Check gifts sent today
        const today = new Date().toISOString().slice(0, 10)
        const todayGifts = {}
        if (giftsSent && giftsSent.date === today) {
          ;(giftsSent.recipients || []).forEach((uid) => {
            todayGifts[uid] = true
          })
        }

        setFriends(friendsData)
        setPendingReceived(receivedData)
        setPendingSent(stillPendingSent)
        setGiftSentToday(todayGifts)
      } catch (err) {
        console.error('Error processing friend profile snapshot:', err)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [user])

  // --- Send Friend Request ---
  const handleSendRequest = async () => {
    if (!searchName.trim()) return
    setSearchError(null)
    setSearchSuccess(null)

    try {
      // Case-insensitive search on users collection
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)

      let foundDoc = null
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.displayName && data.displayName.toLowerCase() === searchName.trim().toLowerCase()) {
          foundDoc = { id: docSnap.id, ...data }
        }
      })

      if (!foundDoc) {
        setSearchError('Joueur introuvable. Vérifiez le pseudo.')
        return
      }

      if (foundDoc.id === user.uid) {
        setSearchError('Vous ne pouvez pas vous ajouter vous-même !')
        return
      }

      // Check if already friends
      const myDoc = await getDoc(doc(db, 'users', user.uid))
      const myFriends = myDoc.data()?.friends || []
      if (myFriends.includes(foundDoc.id)) {
        setSearchError('Ce joueur est déjà dans votre liste d\'amis !')
        return
      }

      // Check if request already sent
      const mySent = myDoc.data()?.friendRequestsSent || []
      if (mySent.some((r) => (r.toUid || r) === foundDoc.id)) {
        setSearchError('Une demande a déjà été envoyée à ce joueur.')
        return
      }

      const now = new Date().toISOString()

      // Add to my sent requests
      await updateDoc(doc(db, 'users', user.uid), {
        friendRequestsSent: arrayUnion({
          toUid: foundDoc.id,
          toName: foundDoc.displayName,
          sentAt: now,
        }),
      })

      // Add to recipient's received requests
      await updateDoc(doc(db, 'users', foundDoc.id), {
        friendRequestsReceived: arrayUnion({
          fromUid: user.uid,
          fromName: userProfile?.displayName || 'Joueur',
          fromPhoto: userProfile?.photoURL || null,
          sentAt: now,
        }),
      }).catch((err) => {
        console.warn('Could not write directly to recipient doc (handled via sync):', err)
      })

      setSearchSuccess(`Demande d'ami envoyée à ${foundDoc.displayName} !`)
      setSearchName('')
    } catch (err) {
      console.error('Error sending friend request:', err)
      setSearchError("Erreur lors de l'envoi de la demande.")
    }
  }

  // --- Accept Friend Request ---
  const handleAcceptRequest = async (requester) => {
    try {
      const myDocRef = doc(db, 'users', user.uid)
      const myDoc = await getDoc(myDocRef)
      const myReceived = myDoc.data()?.friendRequestsReceived || []
      const updatedReceived = myReceived.filter((r) => (r.fromUid || r) !== requester.uid)

      // Add to my friends & remove from received
      await updateDoc(myDocRef, {
        friends: arrayUnion(requester.uid),
        friendRequestsReceived: updatedReceived,
      })

      // Try to add ourselves to requester's friends as well
      const requesterDocRef = doc(db, 'users', requester.uid)
      await updateDoc(requesterDocRef, {
        friends: arrayUnion(user.uid),
      }).catch((err) => {
        console.warn('Requester will auto-sync on their next view:', err)
      })

      window.dispatchEvent(
        new CustomEvent('system_toast', {
          detail: {
            type: 'success',
            title: 'Ami Ajouté !',
            message: `${requester.displayName} est maintenant votre ami.`,
          },
        })
      )
    } catch (err) {
      console.error('Error accepting friend request:', err)
    }
  }

  // --- Reject Friend Request ---
  const handleRejectRequest = async (requester) => {
    try {
      const myDocRef = doc(db, 'users', user.uid)
      const myDoc = await getDoc(myDocRef)
      const myReceived = myDoc.data()?.friendRequestsReceived || []
      const updatedReceived = myReceived.filter((r) => (r.fromUid || r) !== requester.uid)

      await updateDoc(myDocRef, {
        friendRequestsReceived: updatedReceived,
      })

      window.dispatchEvent(
        new CustomEvent('system_toast', {
          detail: {
            type: 'error',
            title: 'Demande refusée',
            message: `Demande de ${requester.displayName} supprimée.`,
          },
        })
      )
    } catch (err) {
      console.error('Error rejecting friend request:', err)
    }
  }

  // --- Remove Friend ---
  const handleRemoveFriend = async (friendUid) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayRemove(friendUid),
      })
      await updateDoc(doc(db, 'users', friendUid), {
        friends: arrayRemove(user.uid),
      }).catch(() => {})

      window.dispatchEvent(
        new CustomEvent('system_toast', {
          detail: {
            type: 'error',
            title: 'Ami retiré',
            message: 'Le joueur a été retiré de votre liste.',
          },
        })
      )
    } catch (err) {
      console.error('Error removing friend:', err)
    }
  }

  // --- Send Gift ---
  const handleSendGift = async (friend) => {
    if (giftSentToday[friend.uid]) return

    try {
      const today = new Date().toISOString().slice(0, 10)

      const friendSaveRef = doc(db, 'saves', friend.uid)
      const friendSaveDoc = await getDoc(friendSaveRef)
      const existingGifts = friendSaveDoc.exists() ? friendSaveDoc.data().pendingGifts || [] : []

      const gift = {
        fromUid: user.uid,
        fromName: userProfile?.displayName || 'Ami',
        type: 'nectar',
        amount: 0,
        sentAt: new Date().toISOString(),
      }

      await updateDoc(friendSaveRef, {
        pendingGifts: [...existingGifts, gift],
      }).catch(console.error)

      // Track daily gift sent
      const myDoc = await getDoc(doc(db, 'users', user.uid))
      const currentGiftData = myDoc.data()?.giftsSentToday || {}
      const recipients =
        currentGiftData.date === today
          ? [...(currentGiftData.recipients || []), friend.uid]
          : [friend.uid]

      await updateDoc(doc(db, 'users', user.uid), {
        giftsSentToday: { date: today, recipients },
      })

      setGiftSentToday((prev) => ({ ...prev, [friend.uid]: true }))

      window.dispatchEvent(
        new CustomEvent('system_toast', {
          detail: {
            type: 'success',
            title: '🎁 Cadeau Envoyé !',
            message: `Un Pot de Nectar a été envoyé à ${friend.displayName} !`,
          },
        })
      )
    } catch (err) {
      console.error('Error sending gift:', err)
    }
  }

  // --- Claim Gift ---
  const handleClaimGift = (index) => {
    gameState.dispatch({ type: 'CLAIM_GIFT', giftIndex: index })
    window.dispatchEvent(
      new CustomEvent('system_toast', {
        detail: {
          type: 'success',
          title: '🍯 Cadeau Réclamé !',
          message: 'Le miel a été ajouté à votre réserve !',
        },
      })
    )
  }

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
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }} className="friend-honey">
          Chaque ami = +1% de production (max +10%). Bonus actuel :{' '}
          <strong style={{ color: 'var(--text-honey)' }}>+{Math.min(friends.length, 10)}%</strong>
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
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '6px',
                  background: 'var(--cannot-afford)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
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
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '6px',
                  background: 'var(--honey)',
                  color: '#000',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                {pendingGifts.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB: Friends */}
        {activeTab === 'friends' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="friend-add-input"
                placeholder="Pseudo du joueur..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
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
                Aucun ami pour l'instant. Invitez vos amis !
              </div>
            )}

            {!loading &&
              friends.map((friend) => (
                <div className="friend-entry" key={friend.uid} style={{ position: 'relative' }}>
                  {friend.photoURL && <img src={friend.photoURL} alt="" className="friend-avatar" />}
                  <div className="friend-info" style={{ cursor: 'pointer' }} onClick={() => setVisitingFriend(friend)}>
                    <div className="friend-name">{friend.displayName}</div>
                    <div className="friend-honey">
                      🍯 {formatNumber(friend.totalHoney)} total · +{formatNumber(friend.honeyPerSecond)}/sec
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      className="mc-button"
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                      onClick={() => setVisitingFriend(friend)}
                      title="Visiter la ruche"
                    >
                      🏠
                    </button>
                    <button
                      className={`mc-button ${giftSentToday[friend.uid] ? '' : 'primary'}`}
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                      onClick={() => handleSendGift(friend)}
                      disabled={giftSentToday[friend.uid]}
                      title={giftSentToday[friend.uid] ? 'Cadeau envoyé aujourd\'hui' : 'Envoyer un Pot de Nectar'}
                    >
                      {giftSentToday[friend.uid] ? '✅' : '🎁'}
                    </button>
                    <button
                      className="mc-button danger"
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                      onClick={() => handleRemoveFriend(friend.uid)}
                      title="Retirer de mes amis"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
          </>
        )}

        {/* TAB: Requests */}
        {activeTab === 'requests' && (
          <>
            <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '10px' }}>📥 Demandes Reçues</h3>
            {pendingReceived.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center', marginBottom: '16px' }}>
                Aucune demande reçue en attente.
              </div>
            )}
            {pendingReceived.map((req) => (
              <div className="friend-entry" key={req.uid} style={{ marginBottom: '6px' }}>
                {req.photoURL && <img src={req.photoURL} alt="" className="friend-avatar" />}
                <div className="friend-info">
                  <div className="friend-name">{req.displayName}</div>
                  <div className="friend-honey">Souhaite rejoindre votre essaim d'amis</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    className="mc-button primary"
                    style={{ padding: '8px 12px', fontSize: '10px' }}
                    onClick={() => handleAcceptRequest(req)}
                  >
                    ✓ Accepter
                  </button>
                  <button
                    className="mc-button danger"
                    style={{ padding: '8px 12px', fontSize: '10px' }}
                    onClick={() => handleRejectRequest(req)}
                  >
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginTop: '20px', marginBottom: '10px' }}>
              📤 Demandes Envoyées
            </h3>
            {pendingSent.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center' }}>Aucune demande envoyée en attente.</div>
            )}
            {pendingSent.map((req) => (
              <div className="friend-entry" key={req.uid} style={{ opacity: 0.7 }}>
                {req.photoURL && <img src={req.photoURL} alt="" className="friend-avatar" />}
                <div className="friend-info">
                  <div className="friend-name">{req.displayName}</div>
                  <div className="friend-honey" style={{ color: 'var(--text-dim)' }}>
                    ⏳ En attente d'acceptation par le joueur...
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB: Gifts */}
        {activeTab === 'gifts' && (
          <>
            <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '10px' }}>🎁 Pots de Nectar Reçus</h3>
            {pendingGifts.length === 0 && (
              <div className="loading-text" style={{ textAlign: 'center' }}>
                Aucun cadeau pour le moment. Vos amis peuvent vous envoyer 1 pot par jour !
              </div>
            )}
            {pendingGifts.map((gift, index) => (
              <div className="friend-entry" key={index} style={{ borderColor: 'var(--honey-dark)', marginBottom: '6px' }}>
                <div className="upgrade-icon" style={{ fontSize: '20px' }}>🍯</div>
                <div className="friend-info">
                  <div className="friend-name">Pot de Nectar Doré</div>
                  <div className="friend-honey">
                    Envoyé par <strong>{gift.fromName}</strong> · +1 minute de production instantanée
                  </div>
                </div>
                <button
                  className="mc-button primary"
                  style={{ padding: '8px 14px', fontSize: '9px', flexShrink: 0 }}
                  onClick={() => handleClaimGift(index)}
                >
                  Récolter
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* --- Friend Hive Visit Modal --- */}
      {visitingFriend && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setVisitingFriend(null)}
        >
          <div
            className="mc-panel"
            style={{ width: '520px', maxWidth: '96vw', maxHeight: '86vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '12px' }}>🏠 Ruche de {visitingFriend.displayName}</h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid var(--mc-border-dark)',
              }}
            >
              {visitingFriend.photoURL && (
                <img
                  src={visitingFriend.photoURL}
                  alt=""
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '4px',
                    border: '2px solid var(--honey-dark)',
                  }}
                />
              )}
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-honey)', marginBottom: '6px' }}>
                  {visitingFriend.displayName}
                </div>
                <div className="friend-honey" style={{ color: 'var(--text-secondary)' }}>
                  🍯 Miel Total : {formatNumber(visitingFriend.totalHoney)} · +{formatNumber(visitingFriend.honeyPerSecond)}/s
                </div>
                <div className="friend-honey" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  👑 Gelée Royale : {visitingFriend.royalJelly || 0} · 🖱️ Clics : {(visitingFriend.totalClicks || 0).toLocaleString('fr-FR')}
                </div>
                <div className="friend-honey" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ⏱️ Temps de jeu : {formatTime(visitingFriend.playTime)}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '10px' }}>🏗️ Bâtiments Possédés</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {Object.entries(visitingFriend.upgrades || {})
                .filter(([_, count]) => count > 0)
                .map(([id, count]) => {
                  const upgrade = PRODUCTION_UPGRADES.find((u) => u.id === id)
                  if (!upgrade) return null
                  return (
                    <div
                      key={id}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-panel-inner)',
                        border: '2px solid var(--mc-border-dark)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      className="friend-honey"
                    >
                      <span style={{ fontSize: '14px' }}>{upgrade.icon}</span>
                      <span>
                        {upgrade.name}: <strong style={{ color: 'var(--text-honey)' }}>{count}</strong>
                      </span>
                    </div>
                  )
                })}
              {Object.keys(visitingFriend.upgrades || {}).length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }} className="friend-honey">Aucun bâtiment pour l'instant</div>
              )}
            </div>

            <h3 style={{ fontSize: '10px', color: 'var(--text-honey)', marginBottom: '10px' }}>
              🏆 Succès Débloqués ({(visitingFriend.achievements || []).length}/{ACHIEVEMENTS.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {(visitingFriend.achievements || []).map((achId) => {
                const ach = ACHIEVEMENTS.find((a) => a.id === achId)
                return ach ? (
                  <span key={achId} title={ach.name} style={{ fontSize: '18px', cursor: 'help' }}>
                    {ach.icon}
                  </span>
                ) : null
              })}
              {(visitingFriend.achievements || []).length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }} className="friend-honey">Aucun succès débloqué</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`mc-button ${giftSentToday[visitingFriend.uid] ? '' : 'primary'}`}
                style={{ flex: 1 }}
                onClick={() => handleSendGift(visitingFriend)}
                disabled={giftSentToday[visitingFriend.uid]}
              >
                {giftSentToday[visitingFriend.uid] ? '✅ Cadeau déjà envoyé' : '🎁 Envoyer un Pot de Nectar'}
              </button>
              <button className="mc-button" style={{ flex: 1 }} onClick={() => setVisitingFriend(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
