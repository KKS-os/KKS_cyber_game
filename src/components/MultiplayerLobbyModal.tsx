import React, { useState, useEffect } from 'react';
import {
  Users,
  Wifi,
  Copy,
  CheckCircle,
  Radio,
  X,
  Play,
  AlertTriangle,
  Flame,
  Globe,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { multiplayer, FirebaseLobbyRoom } from '../multiplayerManager';
import { MultiplayerRoomInfo } from '../types';
import { Language, getTranslation } from '../localization';
import { sound } from '../audio';

interface MultiplayerLobbyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onStartGame?: () => void;
  language?: Language;
  initialPlayerName?: string;
  characterHue: number;
  onCharacterHueChange?: (hue: number) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen = true,
  onClose,
  onStartGame,
  language = 'MY',
  initialPlayerName = 'CyberRunner',
  characterHue,
  onCharacterHueChange,
}) => {
  const activeLang: Language = language === 'EN' ? 'EN' : 'MY';
  const t = getTranslation(activeLang);
  const isMy = activeLang === 'MY';

  const [activeTab, setActiveTab] = useState<'LIVE' | 'HOST' | 'JOIN'>('LIVE');
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [roomInfo, setRoomInfo] = useState<MultiplayerRoomInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveRooms, setLiveRooms] = useState<FirebaseLobbyRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Check URL params for room code invite (e.g. ?room=CYBER-1234)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInputRoomCode(roomFromUrl.toUpperCase());
      setActiveTab('JOIN');
    }
  }, []);

  // Listen to active live rooms from Firebase Firestore
  useEffect(() => {
    setLoadingRooms(true);
    const unsub = multiplayer.listenToActiveLobbies((rooms) => {
      setLiveRooms(rooms);
      setLoadingRooms(false);
    });
    return () => unsub();
  }, []);

  // Listen to multiplayer network events
  useEffect(() => {
    multiplayer.onRoomUpdate = (info) => {
      setRoomInfo(info);
      if (info.connectionStatus === 'CONNECTED') {
        setIsConnecting(false);
        setErrorBanner(null);
      } else if (info.connectionStatus === 'ERROR') {
        setIsConnecting(false);
        setErrorBanner(info.errorMessage || 'Connection failed.');
      }
    };

    multiplayer.onError = (msg) => {
      setIsConnecting(false);
      setErrorBanner(msg);
    };

    return () => {
      multiplayer.onRoomUpdate = null;
      multiplayer.onError = null;
    };
  }, []);

  const handleHostRoom = async () => {
    try {
      setIsConnecting(true);
      setErrorBanner(null);
      sound.playPowerup();
      await multiplayer.hostRoom(playerName);
    } catch (err: any) {
      setIsConnecting(false);
      setErrorBanner(err.message || 'Failed to initialize Host room.');
    }
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const targetCode = (codeToJoin || inputRoomCode).trim();
    if (!targetCode) {
      setErrorBanner(isMy ? 'အခန်းကုဒ် (Room Code) ရိုက်ထည့်ပါ' : 'Please enter a Room Code');
      return;
    }
    try {
      setIsConnecting(true);
      setErrorBanner(null);
      sound.playPowerup();
      await multiplayer.joinRoom(targetCode, playerName);
    } catch (err: any) {
      setIsConnecting(false);
      setErrorBanner(err.message || 'Could not connect to room.');
    }
  };

  const handleCopyInviteLink = () => {
    if (!roomInfo?.roomId) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomInfo.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sound.playClick();
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleLeaveRoom = () => {
    multiplayer.leaveRoom();
    setRoomInfo(null);
    setIsConnecting(false);
  };

  if (!isOpen) return null;

  const isConnected = roomInfo?.connectionStatus === 'CONNECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-mono-tech overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#070314] border-2 border-[#00FFD1] p-4 sm:p-6 shadow-[0_0_35px_rgba(0,255,209,0.35)] my-auto max-h-[92vh] overflow-y-auto">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#00FFD1]/30 pb-3 mb-3">
          <div className="flex items-center gap-2.5 text-[#00FFD1]">
            <Users size={24} className="text-[#00FFD1] animate-pulse shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">
                  {t.multiplayerTitle}
                </h2>
                <span className="px-1.5 py-0.5 bg-[#FF00E5]/20 border border-[#FF00E5]/60 text-[#FF00E5] text-[8px] font-black rounded uppercase flex items-center gap-1">
                  <Flame size={10} /> FIREBASE CLOUD
                </span>
              </div>
              <p className="text-[10px] text-cyan-300/70">
                {isMy
                  ? 'Firebase Firestore ဖြင့် အချိန်နှင့်တပြေးညီ ချိတ်ဆက်ထားသော Squad Co-Op စနစ်'
                  : 'Real-time Squad Co-Op synchronized via Firebase Cloud Firestore'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Firebase Live Cloud Status Pill */}
        <div className="mb-3 px-2.5 py-1 bg-black/60 border border-emerald-500/40 rounded flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isMy ? 'Firebase Cloud Database: ချိတ်ဆက်ထားပြီး' : 'Firebase Cloud Database: Active & Synced'}</span>
          </div>
          <span className="text-gray-400 font-mono">
            {liveRooms.length} {isMy ? 'ခန်းဖွင့်ထားသည်' : 'Active Lobbies'}
          </span>
        </div>

        {/* Error Notification */}
        {errorBanner && (
          <div className="mb-3 p-2.5 bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-red-400" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Player Customization (Call-Sign & Neon Hue) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 p-2.5 bg-black/50 border border-white/10">
          <div>
            <label className="text-[9.5px] text-gray-400 uppercase font-bold block mb-1">
              {t.runnerCallsign}
            </label>
            <input
              type="text"
              maxLength={14}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={isConnected}
              className="w-full bg-[#020108] border border-[#00FFD1]/40 px-3 py-1 text-xs text-white uppercase focus:outline-none focus:border-[#00FFD1]"
              placeholder="RUNNER_01"
            />
          </div>

          <div>
            <label className="text-[9.5px] text-gray-400 uppercase font-bold block mb-1 flex items-center justify-between">
              <span>{isMy ? 'နီယွန် ဝတ်စုံအရောင် (NEON SUIT)' : 'NEON SUIT GLOW'}</span>
              <span className="text-[#00FFD1]">{characterHue}°</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={characterHue}
                onChange={(e) => onCharacterHueChange?.(Number(e.target.value))}
                className="w-full accent-[#00FFD1] cursor-pointer"
              />
              <div
                className="w-5 h-5 rounded-full border border-white shrink-0 shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: `hsl(${characterHue}, 100%, 55%)` }}
              />
            </div>
          </div>
        </div>

        {/* Active Connected Room State */}
        {isConnected && roomInfo ? (
          <div className="space-y-4">
            
            {/* Room Info Header */}
            <div className="bg-[#020108] border-2 border-[#00FFD1] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[9.5px] text-gray-400 block uppercase font-bold">
                  {t.roomCode}
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#00FFD1] tracking-widest font-mono">
                  {roomInfo.roomId}
                </div>
                <span className="text-[9px] text-gray-400">
                  {roomInfo.isHost
                    ? (isMy ? '👑 သင်သည် အခန်းပိုင်ရှင် (HOST) ဖြစ်ပါသည်' : '👑 You are the Room Host')
                    : (isMy ? '🔗 အခန်းသို့ ချိတ်ဆက်ပြီးပါပြီ' : '🔗 Connected to Squad Room')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="px-3 py-2 bg-[#00FFD1]/20 hover:bg-[#00FFD1] text-[#00FFD1] hover:text-black font-black text-xs transition-all flex items-center gap-1.5 border border-[#00FFD1]/40 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? t.inviteLinkCopied : t.copyInviteLink}</span>
                </button>
              </div>
            </div>

            {/* Squad Members List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-gray-300 uppercase flex items-center gap-1.5">
                  <Users size={14} className="text-[#00FFD1]" />
                  {t.connectedRunners} ({1 + (roomInfo.connectedPeers?.length || 0)})
                </span>
                <span className="text-[10px] text-[#00FF66] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                  {isMy ? 'အချိန်နှင့်တပြေးညီ ချိတ်ဆက်ထားသည်' : 'FIREBASE CLOUD SYNC'}
                </span>
              </div>

              <div className="bg-black/60 border border-white/10 divide-y divide-white/10 text-xs">
                {/* Local Player */}
                <div className="p-2.5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: `hsl(${characterHue}, 100%, 55%)` }}
                    />
                    <span className="font-bold text-white uppercase">{playerName} (YOU)</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] bg-[#00FFD1]/20 text-[#00FFD1] border border-[#00FFD1]/40 font-bold">
                    {roomInfo.isHost ? 'HOST' : 'MEMBER'}
                  </span>
                </div>

                {/* Remote Teammates */}
                {roomInfo.connectedPeers && roomInfo.connectedPeers.length > 0 ? (
                  roomInfo.connectedPeers.map((peer) => (
                    <div key={peer.id} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#00FF66] border border-white" />
                        <span className="font-bold text-gray-200 uppercase">{peer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">{peer.pingMs || 25}ms</span>
                        <span className="px-2 py-0.5 text-[9px] bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 font-bold">
                          READY
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-[11px] italic">
                    {t.waitingForTeammates}
                  </div>
                )}
              </div>
            </div>

            {/* Launch / Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onStartGame}
                className="w-full sm:flex-1 py-3 bg-[#00FFD1] hover:bg-[#00FFD1]/80 text-black font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_#00FFD1] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={16} />
                <span>{t.launchMission}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="w-full sm:w-auto px-4 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 font-bold text-xs uppercase transition-all cursor-pointer"
              >
                {t.leaveRoom}
              </button>
            </div>

          </div>
        ) : (
          /* Disconnected State (Tabs: LIVE SQUADS / HOST / JOIN) */
          <div>
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1.5 mb-3 border-b border-white/10 pb-2.5">
              <button
                onClick={() => { setActiveTab('LIVE'); sound.playClick(); }}
                className={`py-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === 'LIVE'
                    ? 'bg-[#00FFD1] text-black border-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)]'
                    : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {isMy ? 'အွန်လိုင်းအခန်းများ' : 'LIVE SQUADS'}
              </button>

              <button
                onClick={() => { setActiveTab('HOST'); sound.playClick(); }}
                className={`py-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === 'HOST'
                    ? 'bg-[#00FFD1] text-black border-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)]'
                    : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {t.hostRoom}
              </button>

              <button
                onClick={() => { setActiveTab('JOIN'); sound.playClick(); }}
                className={`py-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === 'JOIN'
                    ? 'bg-[#00FFD1] text-black border-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.4)]'
                    : 'bg-black/40 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {t.joinRoom}
              </button>
            </div>

            {/* Tab 1: Live Squad Lobbies List */}
            {activeTab === 'LIVE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <Radio size={14} className="text-[#00FFD1] animate-pulse" />
                    {isMy ? 'လက်ရှိဖွင့်ထားသော အခန်းများ' : 'Active Public Squad Rooms'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {liveRooms.length} {isMy ? 'ခန်းတွေ့ရှိ' : 'Found'}
                  </span>
                </div>

                {loadingRooms ? (
                  <div className="p-6 text-center text-cyan-300 text-xs flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{isMy ? 'အခန်းများ ရှာဖွေနေသည်...' : 'Querying Firebase Lobbies...'}</span>
                  </div>
                ) : liveRooms.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {liveRooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-2.5 bg-black/60 border border-cyan-500/30 hover:border-[#00FFD1] flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-xs text-[#00FFD1]">
                              {room.id}
                            </span>
                            <span className="text-[10px] text-gray-300 font-bold">
                              {room.name || `${room.hostName}'s Squad`}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            Host: <span className="text-white">{room.hostName}</span> • Stage {room.stage || 1}
                          </div>
                        </div>

                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={isConnecting}
                          className="px-3 py-1.5 bg-[#00FFD1] hover:bg-white text-black font-black text-[10px] uppercase tracking-wider rounded transition-all shadow-[0_0_10px_rgba(0,255,209,0.3)] cursor-pointer"
                        >
                          {isMy ? 'ဝင်ရောက်မည်' : 'QUICK JOIN'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-black/40 border border-dashed border-white/15 text-xs text-gray-400">
                    <p className="mb-2 text-gray-300 font-bold">
                      {isMy ? 'လတ်တလော ဖွင့်ထားသော အခန်းမရှိသေးပါ' : 'No Active Squad Lobbies Found'}
                    </p>
                    <p className="text-[10px] text-gray-500 mb-3">
                      {isMy ? 'ပထမဦးဆုံး အခန်းဖွင့်၍ သူငယ်ချင်းများကို ဖိတ်ခေါ်လိုက်ပါ!' : 'Be the first to host a squad room and invite your friends!'}
                    </p>
                    <button
                      onClick={() => setActiveTab('HOST')}
                      className="px-4 py-1.5 bg-[#00FFD1]/20 hover:bg-[#00FFD1] text-[#00FFD1] hover:text-black border border-[#00FFD1]/50 text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      {isMy ? 'အခန်းအသစ်ဖွင့်မည်' : 'HOST A SQUAD'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Host Room */}
            {activeTab === 'HOST' && (
              <div className="space-y-4">
                <div className="p-3 bg-black/40 border border-white/10 text-xs text-gray-300 leading-relaxed">
                  <p className="mb-1 text-white font-bold flex items-center gap-1.5">
                    <Zap size={14} className="text-[#00FFD1]" />
                    {isMy ? '📡 Firebase Cloud ပေါ်တွင် အခန်းအသစ်ဖွင့်မည်' : '📡 Host a new Squad Room on Firebase'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {isMy
                      ? 'အခန်းဖွင့်လိုက်သည်နှင့် သီးသန့် Room Code တစ်ခု ရရှိမည်ဖြစ်ပြီး သူငယ်ချင်းများထံသို့ ဖိတ်ခေါ်လင့်ခ် ပေးပို့ကာ အတူတကွ ရန်သူများကို နှိမ်နင်းနိုင်ပါမည်။'
                      : 'Create a room session, receive an instant 4-digit Room Code or Invite Link, and fight bio-hazard swarms cooperatively.'}
                  </p>
                </div>

                <button
                  onClick={handleHostRoom}
                  disabled={isConnecting}
                  className="w-full py-3 bg-[#00FFD1] hover:bg-[#00FFD1]/80 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_#00FFD1] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio size={16} className={isConnecting ? 'animate-spin' : ''} />
                  <span>{isConnecting ? (isMy ? 'အခန်းဖွင့်နေသည်...' : 'INITIALIZING HOST...') : t.hostRoom}</span>
                </button>
              </div>
            )}

            {/* Tab 3: Join Room by Code */}
            {activeTab === 'JOIN' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                    {t.enterRoomCode}
                  </label>
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="E.G. CYBER-9421"
                    className="w-full bg-[#020108] border-2 border-[#00FFD1]/50 px-4 py-2 text-sm text-[#00FFD1] font-mono tracking-widest uppercase focus:outline-none focus:border-[#00FFD1]"
                  />
                </div>

                <button
                  onClick={() => handleJoinRoom()}
                  disabled={isConnecting || !inputRoomCode.trim()}
                  className="w-full py-3 bg-[#00FFD1] hover:bg-[#00FFD1]/80 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_#00FFD1] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wifi size={16} className={isConnecting ? 'animate-pulse' : ''} />
                  <span>{isConnecting ? (isMy ? 'ချိတ်ဆက်နေသည်...' : 'CONNECTING...') : t.joinRoom}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-end text-xs">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-[11px] cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
