import Peer, { DataConnection } from 'peerjs';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuth } from './firebase';
import {
  RemotePlayerState,
  MultiplayerPacket,
  MultiplayerMessageType,
  MultiplayerRoomInfo,
  TacticalPingMessage,
  WeaponType,
} from './types';

export interface FirebaseLobbyRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  status: 'WAITING' | 'IN_GAME' | 'FINISHED';
  stage: number;
  maxPlayers: number;
  playerCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseLeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  distance: number;
  stage: number;
  maxCombo: number;
  timestamp: number;
}

// ============================================================================
// DUAL-HYBRID MULTIPLAYER NETWORK MANAGER
// (Firebase Cloud Matchmaking & Real-Time Sync + Zero-Latency WebRTC P2P)
// ============================================================================
export class MultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  public roomId: string = '';
  public isHost: boolean = false;
  public localPlayerId: string = '';
  public localPlayerName: string = 'CyberRunner';
  public localPlayerHue: number = 0;
  public connected: boolean = false;

  // Firebase Real-time Firestore Unsubscribers
  private unsubPlayers: Unsubscribe | null = null;
  private unsubPings: Unsubscribe | null = null;
  private lastFirestoreSyncTime: number = 0;
  private firestoreHeartbeatTimer: number | null = null;

  public isConnected = (): boolean => {
    return this.connected;
  };

  public remotePlayers: Map<string, RemotePlayerState> = new Map();
  public tacticalPings: TacticalPingMessage[] = [];
  private lastPingSent: number = 0;
  private syncIntervalTimer: number | null = null;

  // Callbacks
  public onRoomUpdate: ((info: MultiplayerRoomInfo) => void) | null = null;
  public onRemotePlayerUpdate: ((players: Map<string, RemotePlayerState>) => void) | null = null;
  public onRemotePlayerAction: ((senderId: string, action: any) => void) | null = null;
  public onTacticalPing: ((ping: TacticalPingMessage) => void) | null = null;
  public onError: ((errorMsg: string) => void) | null = null;

  constructor() {
    this.localPlayerId = 'p-' + Math.random().toString(36).substring(2, 8);
    // Initialize authentication in background
    ensureAuth()
      .then((user) => {
        if (user && user.uid) {
          this.localPlayerId = user.uid;
        }
      })
      .catch(() => {});
  }

  // Generate clean room code, e.g. "CYBER-9421"
  public static generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CYBER-${code}`;
  }

  private getHostPeerId(roomId: string): string {
    const cleanRoom = roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return `neonrunner2-${cleanRoom}-host`;
  }

  // --- 1. FIREBASE REALTIME LOBBY DISCOVERY ---
  public listenToActiveLobbies(callback: (rooms: FirebaseLobbyRoom[]) => void): Unsubscribe {
    try {
      const q = query(
        collection(db, 'multiplayer_rooms'),
        where('status', 'in', ['WAITING', 'IN_GAME']),
        limit(20)
      );
      return onSnapshot(q, (snapshot) => {
        const rooms: FirebaseLobbyRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push(docSnap.data() as FirebaseLobbyRoom);
        });
        rooms.sort((a, b) => b.createdAt - a.createdAt);
        callback(rooms);
      }, (err) => {
        console.warn('[Firebase] Lobby rooms listener warning:', err);
      });
    } catch (err) {
      console.warn('[Firebase] Failed to query active lobbies:', err);
      return () => {};
    }
  }

  // --- 2. HOST A NEW SQUAD ROOM (FIREBASE + WEBRTC) ---
  public async hostRoom(playerName: string, customRoomId?: string): Promise<string> {
    this.cleanup();
    this.localPlayerName = playerName.trim() || 'HostRunner';
    this.roomId = (customRoomId || MultiplayerManager.generateRoomCode()).toUpperCase();
    this.isHost = true;

    this.notifyStatus('CONNECTING');

    try {
      // 1. Authenticate with Firebase
      const authUser = await ensureAuth();
      if (authUser && authUser.uid) {
        this.localPlayerId = authUser.uid;
      }

      // 2. Provision Room document in Firestore
      const roomRef = doc(db, 'multiplayer_rooms', this.roomId);
      await setDoc(roomRef, {
        id: this.roomId,
        name: `${this.localPlayerName}'s Cyber Squad`,
        hostId: this.localPlayerId,
        hostName: this.localPlayerName,
        status: 'WAITING',
        stage: 1,
        maxPlayers: 4,
        playerCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 3. Register Host player presence in Firestore subcollection
      const playerRef = doc(db, 'multiplayer_rooms', this.roomId, 'players', this.localPlayerId);
      await setDoc(playerRef, {
        id: this.localPlayerId,
        name: this.localPlayerName,
        characterHue: this.localPlayerHue || 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        integrity: 100,
        activeWeapon: 'PLASMA_BLASTER',
        score: 0,
        isSlashing: false,
        isBlasting: false,
        isDashing: false,
        lastSeen: Date.now(),
      });

      // 4. Setup Real-time Firestore Listeners for squad members & pings
      this.attachFirestoreListeners(this.roomId);

      this.connected = true;
      this.notifyStatus('CONNECTED');
      this.startHeartbeat();

      // 5. Initialize WebRTC P2P in background for zero-latency direct data streams
      this.initWebRTCHost();

      return this.roomId;
    } catch (err: any) {
      console.error('[Multiplayer] Host room error:', err);
      const msg = err?.message || 'Failed to initialize Firebase room.';
      this.notifyStatus('ERROR', msg);
      if (this.onError) this.onError(msg);
      throw new Error(msg);
    }
  }

  // --- 3. JOIN AN EXISTING SQUAD ROOM (FIREBASE + WEBRTC) ---
  public async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.cleanup();
    this.localPlayerName = playerName.trim() || 'GuestRunner';
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;

    this.notifyStatus('CONNECTING');

    try {
      // 1. Authenticate with Firebase
      const authUser = await ensureAuth();
      if (authUser && authUser.uid) {
        this.localPlayerId = authUser.uid;
      }

      // 2. Register Player in Firestore subcollection
      const playerRef = doc(db, 'multiplayer_rooms', this.roomId, 'players', this.localPlayerId);
      await setDoc(playerRef, {
        id: this.localPlayerId,
        name: this.localPlayerName,
        characterHue: this.localPlayerHue || 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        integrity: 100,
        activeWeapon: 'PLASMA_BLASTER',
        score: 0,
        isSlashing: false,
        isBlasting: false,
        isDashing: false,
        lastSeen: Date.now(),
      });

      // 3. Attach Real-time Listeners
      this.attachFirestoreListeners(this.roomId);

      this.connected = true;
      this.notifyStatus('CONNECTED');
      this.startHeartbeat();

      // 4. Connect WebRTC P2P in background for direct peer speed
      this.initWebRTCClient();

      return true;
    } catch (err: any) {
      console.error('[Multiplayer] Join room error:', err);
      const msg = err?.message || 'Could not connect to Firebase room.';
      this.notifyStatus('ERROR', msg);
      if (this.onError) this.onError(msg);
      throw new Error(msg);
    }
  }

  // --- 4. REAL-TIME FIRESTORE SYNCHRONIZATION LISTENERS ---
  private attachFirestoreListeners(roomId: string) {
    // 1. Listen for squad players in room
    try {
      const playersCol = collection(db, 'multiplayer_rooms', roomId, 'players');
      this.unsubPlayers = onSnapshot(playersCol, (snapshot) => {
        const now = Date.now();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.id && data.id !== this.localPlayerId) {
            // Check if player heartbeat is alive within last 12 seconds
            if (now - (data.lastSeen || 0) < 15000) {
              const existing = this.remotePlayers.get(data.id);
              const updatedState: RemotePlayerState = {
                id: data.id,
                name: data.name || 'Operative',
                x: data.x || 0,
                y: data.y || 0,
                vx: data.vx || 0,
                vy: data.vy || 0,
                angle: data.angle || 0,
                health: data.integrity !== undefined ? data.integrity : 100,
                maxHealth: 100,
                integrity: data.integrity !== undefined ? data.integrity : 100,
                maxIntegrity: 100,
                isCrouching: false,
                isCovered: false,
                isSlashing: !!data.isSlashing,
                isShooting: !!data.isBlasting,
                isBlasting: !!data.isBlasting,
                isDashing: !!data.isDashing,
                isFallingIntoAbyss: false,
                activeWeapon: (data.activeWeapon as WeaponType) || 'PLASMA_BLASTER',
                characterHue: data.characterHue || 0,
                score: data.score || 0,
                kills: 0,
                lastPingTime: now,
                pingMs: existing?.pingMs || 30,
              };
              this.remotePlayers.set(data.id, updatedState);
            } else {
              this.remotePlayers.delete(data.id);
            }
          }
        });

        this.notifyPlayerUpdate();
        this.notifyRoomUpdate();
      });
    } catch (err) {
      console.warn('[Firebase] Players sync listener error:', err);
    }

    // 2. Listen for squad tactical pings in room
    try {
      const pingsCol = collection(db, 'multiplayer_rooms', roomId, 'pings');
      this.unsubPings = onSnapshot(pingsCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as TacticalPingMessage;
            if (data && data.senderId !== this.localPlayerId) {
              this.tacticalPings.push(data);
              if (this.onTacticalPing) this.onTacticalPing(data);
            }
          }
        });
      });
    } catch (err) {
      console.warn('[Firebase] Pings sync listener error:', err);
    }
  }

  // --- 5. BROADCAST LOCAL STATE (FIREBASE + WEBRTC) ---
  public broadcastState(
    position: { x: number; y: number },
    velocity: { x: number; y: number },
    angle: number,
    integrity: number,
    score: number,
    activeWeapon: WeaponType,
    isSlashing: boolean,
    isBlasting: boolean,
    isDashing: boolean
  ) {
    if (!this.connected || !this.roomId) return;

    // 1. High-frequency WebRTC P2P broadcast (Immediate sub-millisecond)
    this.broadcastPacket('PLAYER_STATE', {
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      angle,
      integrity,
      score,
      activeWeapon,
      isSlashing,
      isBlasting,
      isDashing,
      characterHue: this.localPlayerHue,
      time: Date.now(),
    });

    // 2. Reliable Cloud Firestore synchronization (Throttled ~100ms)
    const now = Date.now();
    if (now - this.lastFirestoreSyncTime > 100) {
      this.lastFirestoreSyncTime = now;
      const playerRef = doc(db, 'multiplayer_rooms', this.roomId, 'players', this.localPlayerId);
      setDoc(
        playerRef,
        {
          id: this.localPlayerId,
          name: this.localPlayerName,
          characterHue: this.localPlayerHue || 0,
          x: Math.round(position.x),
          y: Math.round(position.y),
          vx: Math.round(velocity.x * 10) / 10,
          vy: Math.round(velocity.y * 10) / 10,
          angle: Math.round(angle * 100) / 100,
          integrity: Math.max(0, Math.round(integrity)),
          activeWeapon,
          score,
          isSlashing,
          isBlasting,
          isDashing,
          lastSeen: now,
        },
        { merge: true }
      ).catch(() => {});
    }
  }

  public broadcastPlayerState(state: any) {
    if (!state || !this.connected || !this.roomId) return;
    this.broadcastState(
      { x: state.x || 0, y: state.y || 0 },
      { x: state.vx || 0, y: state.vy || 0 },
      state.angle || 0,
      state.health !== undefined ? state.health : (state.integrity || 100),
      state.score || 0,
      state.activeWeapon || 'PLASMA_BLASTER',
      !!state.isSlashing,
      !!state.isShooting || !!state.isBlasting,
      !!state.isDashing
    );
  }

  // --- 6. TACTICAL SQUAD PINGS (FIREBASE + WEBRTC) ---
  public sendTacticalPing(
    arg1: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) {
    if (!this.connected || !this.roomId) return;

    let text = 'TACTICAL PING';
    let rawCategory = 'DANGER';
    let x = 0;
    let y = 0;

    if (typeof arg3 === 'number' && typeof arg4 === 'number') {
      text = String(arg1 || 'PING');
      rawCategory = String(arg2 || 'DANGER');
      x = arg3;
      y = arg4;
    } else if (typeof arg2 === 'number' && typeof arg3 === 'number') {
      rawCategory = String(arg1 || 'DANGER');
      text = String(arg1 || 'PING');
      x = arg2;
      y = arg3;
    }

    // Map to valid Firestore rules pingType: 'DANGER' | 'OBJECTIVE' | 'REGROUP' | 'AMMO' | 'ASSIST'
    let validPingType: 'DANGER' | 'OBJECTIVE' | 'REGROUP' | 'AMMO' | 'ASSIST' = 'DANGER';
    if (rawCategory === 'DANGER' || rawCategory === 'OBJECTIVE' || rawCategory === 'REGROUP' || rawCategory === 'AMMO' || rawCategory === 'ASSIST') {
      validPingType = rawCategory;
    } else if (rawCategory === 'BACKUP') {
      validPingType = 'ASSIST';
    } else if (rawCategory === 'CORE') {
      validPingType = 'OBJECTIVE';
    } else if (rawCategory === 'RUSH' || rawCategory === 'COVER') {
      validPingType = 'REGROUP';
    }

    const ping: TacticalPingMessage = {
      id: 'ping-' + Math.random().toString(36).substring(2, 9),
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      text,
      category: rawCategory as any,
      pingType: validPingType,
      x: Math.round(x),
      y: Math.round(y),
      timestamp: Date.now(),
    };

    this.tacticalPings.push(ping);
    if (this.onTacticalPing) this.onTacticalPing(ping);

    // Send via WebRTC P2P
    this.broadcastPacket('TACTICAL_PING', ping);

    // Save to Firestore subcollection matching security rules
    const pingRef = doc(db, 'multiplayer_rooms', this.roomId, 'pings', ping.id);
    setDoc(pingRef, {
      id: ping.id,
      senderId: ping.senderId,
      senderName: ping.senderName,
      pingType: validPingType,
      x: ping.x,
      y: ping.y,
      timestamp: ping.timestamp,
    }).catch((err) => {
      console.warn('[Firebase] Failed to write ping beacon:', err);
    });

    // Auto-clean old pings locally
    const now = Date.now();
    this.tacticalPings = this.tacticalPings.filter((p) => now - p.timestamp < 10000);
  }

  // --- 7. GLOBAL ARCADE HIGH SCORE SUBMISSION ---
  public async submitHighScore(
    playerName: string,
    score: number,
    distance: number,
    stage: number,
    maxCombo: number
  ): Promise<boolean> {
    try {
      await ensureAuth();
      const scoreId = 'score-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const scoreRef = doc(db, 'leaderboard_scores', scoreId);
      await setDoc(scoreRef, {
        id: scoreId,
        playerName: playerName.trim() || 'Operative',
        score: Math.max(0, score),
        distance: Math.max(0, distance),
        stage: Math.max(1, stage),
        maxCombo: Math.max(0, maxCombo),
        timestamp: Date.now(),
      });
      return true;
    } catch (err) {
      console.warn('[Firebase] High score submission notice:', err);
      return false;
    }
  }

  // --- 8. FETCH TOP LEADERBOARD SCORES ---
  public async fetchLeaderboard(count = 10): Promise<FirebaseLeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, 'leaderboard_scores'),
        orderBy('score', 'desc'),
        limit(count)
      );
      const snapshot = await getDocs(q);
      const entries: FirebaseLeaderboardEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as FirebaseLeaderboardEntry);
      });
      return entries;
    } catch (err) {
      console.warn('[Firebase] Failed to fetch leaderboard:', err);
      return [];
    }
  }

  // --- WEBRTC DIRECT P2P ACCELERATION (OPTIONAL ZERO-LATENCY LAYER) ---
  private initWebRTCHost() {
    try {
      const hostPeerId = this.getHostPeerId(this.roomId);
      this.peer = new Peer(hostPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn, false);
      });
    } catch {
      // Graceful fallback to Firestore
    }
  }

  private initWebRTCClient() {
    try {
      const hostPeerId = this.getHostPeerId(this.roomId);
      const clientPeerId = `neonrunner2-client-${Math.random().toString(36).substring(2, 9)}`;
      this.peer = new Peer(clientPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', () => {
        if (!this.peer) return;
        const conn = this.peer.connect(hostPeerId, {
          reliable: true,
          metadata: { name: this.localPlayerName, id: this.localPlayerId },
        });
        this.hostConnection = conn;
        this.setupConnection(conn, true);
      });
    } catch {
      // Graceful fallback to Firestore
    }
  }

  private setupConnection(conn: DataConnection, isOutbound: boolean) {
    conn.on('data', (raw: any) => {
      try {
        const packet = typeof raw === 'string' ? JSON.parse(raw) : (raw as MultiplayerPacket);
        this.handleIncomingPacket(conn, packet);
      } catch {}
    });

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.notifyRoomUpdate();
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.notifyRoomUpdate();
    });
  }

  private handleIncomingPacket(conn: DataConnection, packet: MultiplayerPacket) {
    const { type, senderId } = packet;
    const payload = packet.payload || packet.data || {};
    if (senderId === this.localPlayerId) return;

    if (type === 'PLAYER_STATE') {
      const existing = this.remotePlayers.get(senderId);
      const now = Date.now();
      const updated: RemotePlayerState = {
        id: senderId,
        name: payload.name || existing?.name || 'Operative',
        x: payload.x || 0,
        y: payload.y || 0,
        vx: payload.vx || 0,
        vy: payload.vy || 0,
        angle: payload.angle || 0,
        health: payload.integrity !== undefined ? payload.integrity : (payload.health !== undefined ? payload.health : 100),
        maxHealth: 100,
        integrity: payload.integrity !== undefined ? payload.integrity : (payload.health !== undefined ? payload.health : 100),
        maxIntegrity: 100,
        isCrouching: !!payload.isCrouching,
        isCovered: !!payload.isCovered,
        activeWeapon: payload.activeWeapon || 'PLASMA_BLASTER',
        isSlashing: !!payload.isSlashing,
        isShooting: !!payload.isBlasting || !!payload.isShooting,
        isBlasting: !!payload.isBlasting || !!payload.isShooting,
        isDashing: !!payload.isDashing,
        isFallingIntoAbyss: !!payload.isFallingIntoAbyss,
        characterHue: payload.characterHue || 0,
        score: payload.score || 0,
        kills: payload.kills || 0,
        lastPingTime: now,
        pingMs: existing?.pingMs || 25,
      };
      this.remotePlayers.set(senderId, updated);
      this.notifyPlayerUpdate();
    } else if (type === 'TACTICAL_PING') {
      this.tacticalPings.push(payload);
      if (this.onTacticalPing) this.onTacticalPing(payload);
    }
  }

  private broadcastPacket(type: MultiplayerMessageType, payload: any) {
    const packet: MultiplayerPacket = {
      type,
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      data: payload,
      payload,
    };
    const serialized = JSON.stringify(packet);
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(serialized);
      }
    }
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(serialized);
    }
  }

  private startHeartbeat() {
    this.syncIntervalTimer = window.setInterval(() => {
      const now = Date.now();
      // Purge silent remote players > 15s
      let changed = false;
      for (const [id, player] of this.remotePlayers.entries()) {
        if (now - player.lastPingTime > 15000) {
          this.remotePlayers.delete(id);
          this.connections.delete(id);
          changed = true;
        }
      }
      if (changed) {
        this.notifyRoomUpdate();
        this.notifyPlayerUpdate();
      }
    }, 3000);
  }

  private notifyStatus(status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR', errMsg?: string) {
    if (this.onRoomUpdate) {
      this.onRoomUpdate({
        roomId: this.roomId,
        isHost: this.isHost,
        localPlayerId: this.localPlayerId,
        localPlayerName: this.localPlayerName,
        connectedPeers: Array.from(this.remotePlayers.values()).map((p) => ({
          id: p.id,
          name: p.name,
          pingMs: p.pingMs,
          isHost: p.id.includes('-host'),
        })),
        connectionStatus: status,
        errorMessage: errMsg,
      });
    }
  }

  private notifyRoomUpdate() {
    this.notifyStatus(this.connected ? 'CONNECTED' : 'DISCONNECTED');
  }

  private notifyPlayerUpdate() {
    if (this.onRemotePlayerUpdate) {
      this.onRemotePlayerUpdate(new Map(this.remotePlayers));
    }
  }

  // --- CLEANUP & LEAVE ---
  public leaveRoom() {
    if (this.roomId && this.localPlayerId) {
      try {
        const playerRef = doc(db, 'multiplayer_rooms', this.roomId, 'players', this.localPlayerId);
        deleteDoc(playerRef).catch(() => {});
        if (this.isHost) {
          const roomRef = doc(db, 'multiplayer_rooms', this.roomId);
          setDoc(roomRef, { status: 'FINISHED', updatedAt: Date.now() }, { merge: true }).catch(() => {});
        }
      } catch {}
    }

    this.cleanup();
    this.notifyStatus('DISCONNECTED');
  }

  public cleanup() {
    if (this.unsubPlayers) {
      this.unsubPlayers();
      this.unsubPlayers = null;
    }
    if (this.unsubPings) {
      this.unsubPings();
      this.unsubPings = null;
    }
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
    if (this.firestoreHeartbeatTimer) {
      clearInterval(this.firestoreHeartbeatTimer);
      this.firestoreHeartbeatTimer = null;
    }
    for (const conn of this.connections.values()) {
      try { conn.close(); } catch {}
    }
    this.connections.clear();
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch {}
      this.hostConnection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
    this.remotePlayers.clear();
    this.connected = false;
  }
}

// Global Singleton Instance
export const multiplayer = new MultiplayerManager();
