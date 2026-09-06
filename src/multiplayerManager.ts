import Peer, { DataConnection } from 'peerjs';
import {
  RemotePlayerState,
  MultiplayerPacket,
  MultiplayerMessageType,
  MultiplayerRoomInfo,
  TacticalPingMessage,
  WeaponType,
} from './types';

// ============================================================================
// WEBRTC P2P MULTIPLAYER NETWORK MANAGER (Zero-Config, Vercel Serverless Ready)
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

  // --- HOST A NEW ROOM ---
  public async hostRoom(playerName: string, customRoomId?: string): Promise<string> {
    this.cleanup();
    this.localPlayerName = playerName.trim() || 'HostRunner';
    this.roomId = (customRoomId || MultiplayerManager.generateRoomCode()).toUpperCase();
    this.isHost = true;

    const hostPeerId = this.getHostPeerId(this.roomId);

    return new Promise((resolve, reject) => {
      try {
        this.notifyStatus('CONNECTING');
        // Initialize Peer with standard public STUN/TURN fallback
        this.peer = new Peer(hostPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        const timeout = setTimeout(() => {
          if (!this.connected) {
            this.notifyStatus('ERROR', 'Host connection timeout. Try another Room Code.');
            reject(new Error('Connection timed out'));
          }
        }, 12000);

        this.peer.on('open', (id) => {
          clearTimeout(timeout);
          this.localPlayerId = id;
          this.connected = true;
          this.notifyStatus('CONNECTED');
          this.startHeartbeat();
          resolve(this.roomId);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn, false);
        });

        this.peer.on('error', (err: any) => {
          clearTimeout(timeout);
          console.warn('[Multiplayer] Host Peer error:', err);
          const msg = err.type === 'unavailable-id'
            ? 'That Room Code is currently occupied. Please choose or generate another Room Code.'
            : (err.message || 'Network signaling error');
          this.notifyStatus('ERROR', msg);
          if (this.onError) this.onError(msg);
          reject(new Error(msg));
        });

      } catch (err: any) {
        this.notifyStatus('ERROR', err?.message || 'Failed to initialize peer network');
        reject(err);
      }
    });
  }

  // --- JOIN AN EXISTING ROOM ---
  public async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.cleanup();
    this.localPlayerName = playerName.trim() || 'GuestRunner';
    this.roomId = roomId.trim().toUpperCase();
    this.isHost = false;

    const hostPeerId = this.getHostPeerId(this.roomId);
    const clientPeerId = `neonrunner2-client-${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      try {
        this.notifyStatus('CONNECTING');
        this.peer = new Peer(clientPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        const timeout = setTimeout(() => {
          if (!this.connected) {
            const msg = `Could not reach room "${this.roomId}". Please verify the room code.`;
            this.notifyStatus('ERROR', msg);
            reject(new Error(msg));
          }
        }, 12000);

        this.peer.on('open', (id) => {
          this.localPlayerId = id;
          if (!this.peer) return;

          // Connect directly to the Host peer
          const conn = this.peer.connect(hostPeerId, {
            reliable: true,
            metadata: { name: this.localPlayerName, id: this.localPlayerId },
          });

          this.hostConnection = conn;
          this.setupConnection(conn, true);

          conn.on('open', () => {
            clearTimeout(timeout);
            this.connected = true;
            this.notifyStatus('CONNECTED');
            this.startHeartbeat();

            // Send handshake
            this.sendPacket(conn, 'HANDSHAKE', {
              name: this.localPlayerName,
              id: this.localPlayerId,
            });

            resolve(true);
          });
        });

        this.peer.on('error', (err: any) => {
          clearTimeout(timeout);
          console.warn('[Multiplayer] Client Peer error:', err);
          const msg = err.type === 'peer-unavailable'
            ? `Room "${this.roomId}" was not found or the host disconnected.`
            : (err.message || 'Failed to connect to room');
          this.notifyStatus('ERROR', msg);
          if (this.onError) this.onError(msg);
          reject(new Error(msg));
        });

      } catch (err: any) {
        this.notifyStatus('ERROR', err?.message || 'Connection error');
        reject(err);
      }
    });
  }

  // --- CONNECTION SETUP & DATA HANDLING ---
  private setupConnection(conn: DataConnection, isOutbound: boolean) {
    conn.on('data', (raw: any) => {
      try {
        const packet = typeof raw === 'string' ? JSON.parse(raw) : (raw as MultiplayerPacket);
        this.handleIncomingPacket(conn, packet);
      } catch (e) {
        console.warn('[Multiplayer] Malformed packet received:', e);
      }
    });

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.notifyRoomUpdate();

      // If we are Host, notify guest of current host info
      if (this.isHost) {
        this.sendPacket(conn, 'HANDSHAKE_ACK', {
          hostName: this.localPlayerName,
          hostId: this.localPlayerId,
          roomId: this.roomId,
        });
      }
    });

    conn.on('close', () => {
      this.handlePeerDisconnected(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('[Multiplayer] Connection error with peer:', conn.peer, err);
      this.handlePeerDisconnected(conn.peer);
    });
  }

  private handleIncomingPacket(conn: DataConnection, packet: MultiplayerPacket) {
    switch (packet.type) {
      case 'HANDSHAKE': {
        const remoteName = packet.data?.name || 'Teammate';
        const remoteId = packet.senderId || conn.peer;
        this.remotePlayers.set(remoteId, {
          id: remoteId,
          name: remoteName,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          health: 100,
          maxHealth: 100,
          isCrouching: false,
          isCovered: false,
          isSlashing: false,
          isShooting: false,
          isDashing: false,
          isFallingIntoAbyss: false,
          activeWeapon: 'PLASMA_BLASTER',
          characterHue: Math.floor(Math.random() * 360),
          score: 0,
          kills: 0,
          lastPingTime: Date.now(),
          pingMs: 25,
        });

        // Host relays to all other connected peers so everyone knows about new player
        if (this.isHost) {
          this.broadcast(packet, conn.peer);
        }

        this.notifyRoomUpdate();
        this.notifyPlayerUpdate();
        break;
      }

      case 'HANDSHAKE_ACK': {
        const hostName = packet.data?.hostName || 'Host';
        const hostId = packet.senderId || conn.peer;
        this.remotePlayers.set(hostId, {
          id: hostId,
          name: hostName,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          angle: 0,
          health: 100,
          maxHealth: 100,
          isCrouching: false,
          isCovered: false,
          isSlashing: false,
          isShooting: false,
          isDashing: false,
          isFallingIntoAbyss: false,
          activeWeapon: 'PLASMA_BLASTER',
          characterHue: 0,
          score: 0,
          kills: 0,
          lastPingTime: Date.now(),
          pingMs: 20,
        });
        this.notifyRoomUpdate();
        this.notifyPlayerUpdate();
        break;
      }

      case 'PLAYER_STATE': {
        const remote = this.remotePlayers.get(packet.senderId);
        if (remote) {
          Object.assign(remote, packet.data);
          remote.lastPingTime = Date.now();
        } else {
          // Register remote if not yet present
          this.remotePlayers.set(packet.senderId, {
            id: packet.senderId,
            name: packet.senderName,
            x: packet.data?.x || 0,
            y: packet.data?.y || 0,
            vx: packet.data?.vx || 0,
            vy: packet.data?.vy || 0,
            angle: packet.data?.angle || 0,
            health: packet.data?.health ?? 100,
            maxHealth: 100,
            isCrouching: !!packet.data?.isCrouching,
            isCovered: !!packet.data?.isCovered,
            isSlashing: !!packet.data?.isSlashing,
            isShooting: !!packet.data?.isShooting,
            isDashing: !!packet.data?.isDashing,
            isFallingIntoAbyss: !!packet.data?.isFallingIntoAbyss,
            activeWeapon: packet.data?.activeWeapon || 'PLASMA_BLASTER',
            characterHue: packet.data?.characterHue || 140,
            score: packet.data?.score || 0,
            kills: packet.data?.kills || 0,
            lastPingTime: Date.now(),
            pingMs: 25,
          });
        }

        // Host re-broadcasts guest state to other guests
        if (this.isHost) {
          this.broadcast(packet, conn.peer);
        }

        this.notifyPlayerUpdate();
        break;
      }

      case 'PLAYER_ACTION': {
        if (this.onRemotePlayerAction) {
          this.onRemotePlayerAction(packet.senderId, packet.data);
        }
        if (this.isHost) {
          this.broadcast(packet, conn.peer);
        }
        break;
      }

      case 'TACTICAL_PING': {
        const pingMsg: TacticalPingMessage = {
          id: 'ping-' + Date.now(),
          senderId: packet.senderId,
          senderName: packet.senderName,
          text: packet.data?.text || 'PING',
          category: packet.data?.category || 'RUSH',
          x: packet.data?.x || 0,
          y: packet.data?.y || 0,
          timestamp: Date.now(),
        };
        this.tacticalPings.push(pingMsg);
        if (this.tacticalPings.length > 20) {
          this.tacticalPings.shift();
        }
        if (this.onTacticalPing) {
          this.onTacticalPing(pingMsg);
        }
        if (this.isHost) {
          this.broadcast(packet, conn.peer);
        }
        break;
      }

      case 'PLAYER_LEAVE': {
        this.handlePeerDisconnected(packet.senderId);
        break;
      }
    }
  }

  private handlePeerDisconnected(peerId: string) {
    this.connections.delete(peerId);
    this.remotePlayers.delete(peerId);
    this.notifyRoomUpdate();
    this.notifyPlayerUpdate();

    // If host disconnected from guest's perspective
    if (!this.isHost && this.hostConnection && this.hostConnection.peer === peerId) {
      this.notifyStatus('ERROR', 'The Host has closed the session.');
      this.cleanup();
    }
  }

  // --- BROADCASTING & STATE SYNC ---
  public broadcastPlayerState(state: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    health: number;
    isCrouching: boolean;
    isCovered: boolean;
    isSlashing: boolean;
    isShooting: boolean;
    isDashing: boolean;
    isFallingIntoAbyss: boolean;
    activeWeapon: WeaponType;
    characterHue: number;
    score: number;
    kills: number;
  }) {
    if (!this.connected) return;
    this.broadcastPacket('PLAYER_STATE', state);
  }

  public sendPlayerAction(action: {
    type: 'SLASH' | 'SHOOT' | 'DASH' | 'DAMAGE_ENEMY' | 'HACK';
    originX?: number;
    originY?: number;
    targetX?: number;
    targetY?: number;
    weaponType?: WeaponType;
    damage?: number;
    enemyId?: string;
  }) {
    if (!this.connected) return;
    this.broadcastPacket('PLAYER_ACTION', action);
  }

  public sendTacticalPing(
    text: string,
    category: 'RUSH' | 'COVER' | 'BACKUP' | 'CORE' | 'DANGER',
    x: number,
    y: number
  ) {
    const localPing: TacticalPingMessage = {
      id: 'ping-' + Date.now(),
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      text,
      category,
      x,
      y,
      timestamp: Date.now(),
    };
    this.tacticalPings.push(localPing);
    if (this.tacticalPings.length > 20) {
      this.tacticalPings.shift();
    }
    if (!this.connected) return;
    this.broadcastPacket('TACTICAL_PING', { text, category, x, y });
  }

  private broadcastPacket(type: MultiplayerMessageType, data: any) {
    const packet: MultiplayerPacket = {
      type,
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      timestamp: Date.now(),
      data,
    };

    if (this.isHost) {
      this.broadcast(packet);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(packet);
    }
  }

  private broadcast(packet: MultiplayerPacket, excludePeerId?: string) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(packet);
      }
    }
  }

  private sendPacket(conn: DataConnection, type: MultiplayerMessageType, data: any) {
    if (!conn.open) return;
    const packet: MultiplayerPacket = {
      type,
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      timestamp: Date.now(),
      data,
    };
    conn.send(packet);
  }

  // --- HEARTBEAT & NOTIFICATIONS ---
  private startHeartbeat() {
    if (this.syncIntervalTimer) clearInterval(this.syncIntervalTimer);
    this.syncIntervalTimer = window.setInterval(() => {
      const now = Date.now();
      // Purge disconnected peers silent for > 8 seconds
      let changed = false;
      for (const [id, player] of this.remotePlayers.entries()) {
        if (now - player.lastPingTime > 8000) {
          this.remotePlayers.delete(id);
          this.connections.delete(id);
          changed = true;
        }
      }
      if (changed) {
        this.notifyRoomUpdate();
        this.notifyPlayerUpdate();
      }
    }, 2500);
  }

  private notifyStatus(status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR', errMsg?: string) {
    if (this.onRoomUpdate) {
      this.onRoomUpdate({
        roomId: this.roomId,
        isHost: this.isHost,
        localPlayerId: this.localPlayerId,
        localPlayerName: this.localPlayerName,
        connectedPeers: Array.from(this.remotePlayers.values()).map(p => ({
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

  // --- CLEANUP ---
  public leaveRoom() {
    if (this.connected) {
      this.broadcastPacket('PLAYER_LEAVE', {});
    }
    this.cleanup();
    this.notifyStatus('DISCONNECTED');
  }

  public cleanup() {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
    for (const conn of this.connections.values()) {
      try { conn.close(); } catch (e) { /* noop */ }
    }
    this.connections.clear();
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch (e) { /* noop */ }
      this.hostConnection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) { /* noop */ }
      this.peer = null;
    }
    this.remotePlayers.clear();
    this.connected = false;
  }
}

// Global Singleton Instance
export const multiplayer = new MultiplayerManager();
