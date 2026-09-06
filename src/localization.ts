// ============================================================================
// BILINGUAL LOCALIZATION ENGINE (ENGLISH 🇬🇧 & MYANMAR 🇲🇲)
// High-performance, zero-dependency client-side translation dictionary
// ============================================================================

export type Language = 'EN' | 'MY';

export interface TranslationDictionary {
  // Common UI & Navigation
  appName: string;
  appSubtitle: string;
  language: string;
  languageName: string;
  languageSwitch: string;
  acknowledge: string;
  close: string;
  back: string;
  loading: string;
  enabled: string;
  muted: string;
  active: string;
  off: string;
  ready: string;
  locked: string;
  stage: string;

  // Start Screen & Dossier
  neuralDirectLink: string;
  highFidelityEngine: string;
  cyberOperative: string;
  cyborgNinja: string;
  plasmaKatanaReady: string;
  biohazardThreat: string;
  mutantSwarm: string;
  adaptiveAIDirector: string;
  sectorObjective: string;
  quantumExtraction: string;
  retrieveBioCores: string;
  highScore: string;
  peakStreak: string;
  initializeDeployment: string;
  howToPlay: string;
  controlsMove: string;
  controlsMoveSub: string;
  controlsCombat: string;
  controlsCombatSub: string;
  controlsDash: string;
  controlsDashSub: string;
  soundSFX: string;
  synthBGM: string;

  // In-Game HUD
  integrity: string;
  score: string;
  cores: string;
  portalReadyEscape: string;
  portalLocked: string;
  shield: string;
  overdrive: string;
  slow: string;
  guideBtn: string;
  combo: string;

  // Boss Emergence & Spawn Clearance
  bossSpawnBlockedTitle: string;
  bossSpawnBlockedReason: string;
  bossSpawnBlockedAction: string;
  bossSpawnImminent: string;
  bossSpawnImminentSub: string;
  bossWarpStabilizing: string;
  bossEmergedTitle: string;

  // Weapons Arsenal
  weaponKatana: string;
  weaponKatanaDesc: string;
  weaponBlaster: string;
  weaponBlasterDesc: string;
  weaponSpread: string;
  weaponSpreadDesc: string;
  weaponLightning: string;
  weaponLightningDesc: string;
  weaponMissiles: string;
  weaponMissilesDesc: string;
  weaponVortex: string;
  weaponVortexDesc: string;

  // Pause Modal & Settings
  paused: string;
  neuralSuspended: string;
  resumeHint: string;
  resumeRun: string;
  settings: string;
  quitGame: string;
  systemConfig: string;
  neuralInterfaceSettings: string;
  sfxDesc: string;
  musicDesc: string;
  crtScanlines: string;
  crtScanlinesDesc: string;
  languageSelect: string;
  languageSelectDesc: string;
  returnToPause: string;

  // Game Over & Results
  gameOver: string;
  systemCrash: string;
  runTerminated: string;
  newHighScore: string;
  currentSessionScore: string;
  allTimeHighScore: string;
  distance: string;
  dataCores: string;
  rebootSession: string;
  stageClear: string;
  proceedNextStage: string;
  victoryTitle: string;
  playAgain: string;
  pitfallWarning: string;
  pitfallSub: string;
  pitfallDepth: string;
  pitfallVelocity: string;
  pitfallTerminal: string;
  pitfallCauseOfDeathTitle: string;
  pitfallCauseOfDeathDesc: string;
  pitfallCauseOfDeathTip: string;

  // Combat Guide Tabs
  guideProtocol: string;
  guideTitle: string;
  tabOverview: string;
  tabControls: string;
  tabAIRules: string;
  tabProTips: string;

  // Guide Tab 1: Overview
  guideOverviewTitle: string;
  guideOverviewText: string;
  guideAINeuralTitle: string;
  guideAINeuralDesc: string;
  guideRhythmTitle: string;
  guideRhythmDesc: string;

  // Guide Tab 2: Controls & Tactics
  guideKatanaTitle: string;
  guideKatanaKeys: string;
  guideKatanaDesc: string;
  guideBlasterTitle: string;
  guideBlasterKeys: string;
  guideBlasterDesc: string;
  guideDashTitle: string;
  guideDashKeys: string;
  guideDashDesc: string;
  guideStealthTitle: string;
  guideStealthKeys: string;
  guideStealthDesc: string;

  // Guide Tab 3: AI Rules & Hazards
  guideRule1Title: string;
  guideRule1Desc: string;
  guideRule1Tip: string;
  guideRule2Title: string;
  guideRule2Desc: string;
  guideRule2Evade: string;
  guideRule2EvadeDesc: string;
  guideRule2Block: string;
  guideRule2BlockDesc: string;
  guideRule3Title: string;
  guideRule3Desc: string;
  guideRule3P1: string;
  guideRule3P2: string;
  guideRule4Title: string;
  guideRule4Desc: string;
  guideRule4P1: string;
  guideRule4P2: string;

  // Guide Tab 4: Pro Tips
  guideTip1Title: string;
  guideTip1Desc: string;
  guideTip2Title: string;
  guideTip2Desc: string;
  guideTip3Title: string;
  guideTip3Desc: string;
  guideTip4Title: string;
  guideTip4Desc: string;

  // Multiplayer & Vercel
  multiplayerTitle: string;
  multiplayerSubtitle: string;
  soloPlay: string;
  multiplayerCoop: string;
  hostRoom: string;
  joinRoom: string;
  roomCode: string;
  enterRoomCode: string;
  runnerCallsign: string;
  copyInviteLink: string;
  inviteLinkCopied: string;
  connectedRunners: string;
  waitingForTeammates: string;
  launchMission: string;
  leaveRoom: string;
  vercelGuideBtn: string;
  vercelGuideTitle: string;
  tacticalComms: string;
  tacticalPing: string;
  multiplayerSquad: string;
  vercelDeployGuide: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  EN: {
    appName: 'REMIX NEON CYBER RUNNER 2',
    appSubtitle: 'HIGH-FIDELITY CYBERNETIC COMBAT ENGINE',
    language: 'LANGUAGE',
    languageName: 'ENGLISH',
    languageSwitch: '🌐 EN / MY',
    acknowledge: 'ACKNOWLEDGE & DEPLOY',
    close: 'CLOSE',
    back: 'BACK',
    loading: 'INITIALIZING...',
    enabled: 'ENABLED',
    muted: 'MUTED',
    active: 'ACTIVE',
    off: 'OFF',
    ready: 'READY',
    locked: 'LOCKED',
    stage: 'STAGE',

    // Start Screen
    neuralDirectLink: 'NEURAL DIRECT LINK // SECTOR 01',
    highFidelityEngine: 'TACTICAL 3D CYBERPUNK ACTION ENGINE',
    cyberOperative: 'CYBER OPERATIVE',
    cyborgNinja: 'CYBORG NINJA',
    plasmaKatanaReady: 'PLASMA KATANA READY',
    biohazardThreat: 'BIO-HAZARD THREAT',
    mutantSwarm: 'MUTANT SWARM',
    adaptiveAIDirector: 'ADAPTIVE AI DIRECT',
    sectorObjective: 'SECTOR OBJECTIVE',
    quantumExtraction: 'QUANTUM EXTRACTION',
    retrieveBioCores: 'RETRIEVE 3 BIO-CORES',
    highScore: 'HIGH SCORE',
    peakStreak: 'PEAK STREAK',
    initializeDeployment: 'INITIALIZE DEPLOYMENT',
    howToPlay: 'HOW TO PLAY',
    controlsMove: 'W / A / S / D',
    controlsMoveSub: '360° Move',
    controlsCombat: 'CLICK / J / K',
    controlsCombatSub: 'Blade & Gun',
    controlsDash: 'SPACE / SHIFT',
    controlsDashSub: 'Phase Dash',
    soundSFX: 'SFX AUDIO',
    synthBGM: 'SYNTH BGM',

    // HUD
    integrity: 'INTEGRITY',
    score: 'SCORE',
    cores: 'Cores',
    portalReadyEscape: 'PORTAL READY // ESCAPE NOW',
    portalLocked: 'PORTAL LOCKED // NEED CORES',
    shield: 'SHIELD',
    overdrive: 'OVERDRIVE',
    slow: 'SLOW',
    guideBtn: 'GUIDE',
    combo: 'COMBO',

    // Boss Emergence & Spawn Clearance
    bossSpawnBlockedTitle: '🚨 BOSS EMERGENCE HALTED: SPAWN POINT OCCUPIED',
    bossSpawnBlockedReason: 'The Apex Titan cannot emerge because the Hero (Player) is standing directly inside the Dimensional Warp Rift. Dimensional Teleport Collision Safeguard is active.',
    bossSpawnBlockedAction: '👉 Step back from the red hazard perimeter to allow the Boss to materialize!',
    bossSpawnImminent: '⚡ [BOSS EMERGENCE INITIATED]',
    bossSpawnImminentSub: 'Spawn coordinates clear! Stand by for Apex Titan breach in',
    bossWarpStabilizing: 'WARP CORES STABILIZING',
    bossEmergedTitle: '👑 APEX CYBER-LORD TITAN HAS EMERGED!',

    // Weapons
    weaponKatana: 'PLASMA KATANA',
    weaponKatanaDesc: 'Blistering 3-stage melee blade with 180° sweep.',
    weaponBlaster: 'PLASMA BLASTER',
    weaponBlasterDesc: 'Rapid-fire concentrated energy beam.',
    weaponSpread: 'SPREAD CANNON',
    weaponSpreadDesc: 'Wide multi-pellet tactical burst.',
    weaponLightning: 'CHAIN LIGHTNING',
    weaponLightningDesc: 'Arcs high-voltage arcs across multiple enemies.',
    weaponMissiles: 'HOMING MISSILES',
    weaponMissilesDesc: 'Smart lock-on micro rockets.',
    weaponVortex: 'GRAVITY VORTEX',
    weaponVortexDesc: 'Creates a singularity crushing all nearby foes.',

    // Pause & Settings
    paused: 'PAUSED',
    neuralSuspended: 'NEURAL RUNNER SUSPENDED',
    resumeHint: 'PRESS [SPACE] OR TOUCH TO RESUME',
    resumeRun: 'RESUME RUN',
    settings: 'SETTINGS',
    quitGame: 'QUIT GAME',
    systemConfig: 'SYSTEM CONFIG',
    neuralInterfaceSettings: 'NEURAL INTERFACE SETTINGS',
    sfxDesc: 'Web Audio dynamic sound synthesis',
    musicDesc: 'Procedural dual-oscillator synthwave BGM',
    crtScanlines: 'CRT SCANLINES',
    crtScanlinesDesc: 'Retro arcade scanline raster overlay',
    languageSelect: 'GAME LANGUAGE',
    languageSelectDesc: 'Switch interface between English & မြန်မာဘာသာ',
    returnToPause: 'RETURN TO PAUSE MENU',

    // Game Over & Results
    gameOver: 'GAME OVER',
    systemCrash: 'SYSTEM CRASH // SECTOR BREACHED',
    runTerminated: 'NEURAL RUN TERMINATED • PRESS REBOOT TO INITIALIZE NEW SESSION',
    newHighScore: 'NEW ALL-TIME HIGH SCORE!',
    currentSessionScore: 'CURRENT SESSION SCORE',
    allTimeHighScore: 'ALL-TIME HIGH SCORE',
    distance: 'Distance',
    dataCores: 'Data Cores',
    rebootSession: 'REBOOT SESSION & RETRY',
    stageClear: 'STAGE CLEAR',
    proceedNextStage: 'PROCEED TO NEXT STAGE',
    victoryTitle: 'APEX VICTORY ACHIEVED',
    playAgain: 'PLAY AGAIN',
    pitfallWarning: '⚠️ CRITICAL PITFALL // FREE-FALLING INTO ABYSS',
    pitfallSub: 'FRACTURED FLOOR COLLAPSE • ALTITUDE DROPPING RAPIDLY',
    pitfallDepth: 'ABYSS DEPTH',
    pitfallVelocity: 'FALL VELOCITY',
    pitfallTerminal: 'TERMINAL VELOCITY REACHED // FATAL IMPACT IMMINENT',
    pitfallCauseOfDeathTitle: '⚠️ CAUSE OF DEATH: PLUMMETED INTO BOTTOMLESS CHASM',
    pitfallCauseOfDeathDesc: 'Stepped into a fractured sub-level void chasm without evasive air maneuvers.',
    pitfallCauseOfDeathTip: '💡 TACTICAL TIP: Use Dash (Space / Shift / Dash Button) or Aerial Slashes to leap and phase across broken floors!',

    // Guide
    guideProtocol: 'TACTICAL PROTOCOL // PRO MANUAL',
    guideTitle: 'COMBAT & SURVIVAL GUIDE',
    tabOverview: '1. OVERVIEW',
    tabControls: '2. CONTROLS',
    tabAIRules: '3. HARDCORE AI RULES',
    tabProTips: '4. PRO-TIPS',

    guideOverviewTitle: 'THE NEON QUARANTINE PROTOCOL',
    guideOverviewText: 'In Remix Neon Cyber Runner 2, you are a cyber-operative deployed into procedurally generated quarantine megacity sectors overrun by mutating rogue viral entities. Your mission is to infiltrate, eliminate hostiles, hack data terminals, collect 3 Bio-Cores, and reach the extraction portals alive.',
    guideAINeuralTitle: 'ADAPTIVE NEURAL AI DIRECTOR',
    guideAINeuralDesc: 'Enemies monitor your combat patterns in real-time, punishing button-mashing and cancelling attack frames to parry, block, or dash away.',
    guideRhythmTitle: 'SYNTHWAVE RHYTHM COMBAT',
    guideRhythmDesc: 'All attacks synchronize with the 120-140 BPM synthwave soundtrack. Striking exactly on the beat unlocks up to 3.5x Critical Burst Multipliers.',

    guideKatanaTitle: 'CHOP // CYBER PLASMA KATANA',
    guideKatanaKeys: 'CLICK / J / KEYBOARD',
    guideKatanaDesc: 'A blistering 3-stage combo melee slash. Deals massive damage in a 180° arc. High rhythm synchronization yields instant burst decimation.',
    guideBlasterTitle: 'BLAST // EXOTIC WEAPON ARSENAL',
    guideBlasterKeys: 'RIGHT-CLICK / K',
    guideBlasterDesc: 'Discharges your equipped exotic weapon: Plasma Blaster, Spread Cannon, Chain Lightning, Missiles, or Gravity Vortex.',
    guideDashTitle: 'DASH // HYPERSONIC PHASE EVASION',
    guideDashKeys: 'SPACE / SHIFT',
    guideDashDesc: 'Propels you forward with Invulnerability Frames (i-Frames). Pierce through enemy bullet barrages and cross broken pit hazards safely.',
    guideStealthTitle: 'STEALTH, CROUCH & TAKEDOWNS',
    guideStealthKeys: 'C / SNEAK BUTTON',
    guideStealthDesc: 'Crouch to halve footstep sound telemetry and execute silent Cyber Takedowns from behind enemies before they alert the hive.',

    guideRule1Title: '1. DYNAMIC COMBO INPUTS & ANTI-MASH PENALTY',
    guideRule1Desc: 'Single-button spamming (e.g. Slash ➔ Slash ➔ Slash) is heavily penalized: your attack damage drops to 25%-40% and triggers blunt hit sound feedback.',
    guideRule1Tip: 'To unleash 2.5x Critical Finishers, rotate your moves: [⚔️ Slash] ➔ [🔫 Shoot] ➔ [⚡ Dash/Crouch/Hack] = 💥 2.5x CRITICAL FINISHER!',
    guideRule2Title: '2. 75% TACTICAL AI COMBO PREDICTION',
    guideRule2Desc: 'When you repeat the same attack sequence, enemies have a 75% tactical chance to predict your final finisher:',
    guideRule2Evade: '💨 PREDICTIVE EVASION DASH',
    guideRule2EvadeDesc: 'The enemy phase-dashes away from your blade trajectory, evading all incoming damage.',
    guideRule2Block: '🛡️ PREDICTIVE DEFENSIVE BLOCK',
    guideRule2BlockDesc: 'The enemy raises a hardened organic kinetic barrier, deflecting 85% of incoming damage.',
    guideRule3Title: '3. PIT HAZARD & CRATER EDGE NAVIGATION',
    guideRule3Desc: 'Mutated organisms use spatial raycasts to detect explosion craters and pit abyss hazards:',
    guideRule3P1: 'Falling into a broken floor crater or void pit causes INSTANT FATAL DEATH.',
    guideRule3P2: 'Enemies do not fall into pits; if you stand across a chasm, they shoot Ranged Acid Splash projectiles across the gap on a 2.0s cooldown. Watch for orange neon hazard beacon lasers!',
    guideRule4Title: '4. EXECUTIONER PROTOCOL & COGNITIVE PRESSURE',
    guideRule4Desc: 'Remaining stationary or turtling passively for >1.5s activates Executioner Protocol:',
    guideRule4P1: 'Ranged Spitters launch predictive mortar artillery at your future trajectory.',
    guideRule4P2: 'A throbbing crimson vignette constricts your screen until you perform an active dash or attack.',

    guideTip1Title: 'VARIATE YOUR COMBAT INPUTS',
    guideTip1Desc: 'Never perform the exact same action twice. Weave CHOP ➔ BLAST ➔ DASH ➔ CHOP. Keeping input variety high prevents enemy parries and boosts damage.',
    guideTip2Title: 'BAIT THE PARRY STANCE & WHIFF-PUNISH',
    guideTip2Desc: 'When an elite enemy glows in golden Parry Stance, hold your attack for 0.2s or Phase-Dash to their flank. Strike immediately as their guard drops.',
    guideTip3Title: 'BREAK THE RED VIGNETTE WITH ACTIVE ENGAGEMENT',
    guideTip3Desc: 'If the crimson stress vignette appears, dash or strike an enemy immediately to reset the pressure gauge and silence mortar attacks.',
    guideTip4Title: 'TIMING WITH SYNTH BEATS FOR 3.5X DAMAGE',
    guideTip4Desc: 'Watch the pulsating HUD metronome icon or listen to the bass kick. Striking on the beat guarantees critical strikes and faster weapon cooldowns.',

    // Multiplayer & Vercel
    multiplayerTitle: 'NEURAL CO-OP MULTIPLAYER',
    multiplayerSubtitle: 'SERVERLESS WEBRTC PEER-TO-PEER NETWORK',
    soloPlay: 'SOLO CYBER RUN',
    multiplayerCoop: 'CO-OP MULTIPLAYER',
    hostRoom: 'HOST CO-OP ROOM',
    joinRoom: 'JOIN ROOM',
    roomCode: 'ROOM CODE',
    enterRoomCode: 'ENTER 4-DIGIT ROOM CODE',
    runnerCallsign: 'RUNNER CALL-SIGN',
    copyInviteLink: 'COPY INVITE LINK',
    inviteLinkCopied: 'COPIED TO CLIPBOARD!',
    connectedRunners: 'CONNECTED RUNNERS',
    waitingForTeammates: 'WAITING FOR SQUADMATES TO CONNECT...',
    launchMission: 'LAUNCH CO-OP MISSION',
    leaveRoom: 'LEAVE / DISCONNECT',
    vercelGuideBtn: 'VERCEL DEPLOY GUIDE',
    vercelGuideTitle: 'VERCEL 1-CLICK DEPLOYMENT GUIDE',
    tacticalComms: 'TACTICAL COMMS',
    tacticalPing: 'TACTICAL PING',
    multiplayerSquad: 'MULTIPLAYER SQUAD',
    vercelDeployGuide: 'VERCEL DEPLOY',
  },

  MY: {
    appName: 'ရီးမစ်စ် နီယွန် ဆိုက်ဘာ ရန်းနား ၂',
    appSubtitle: 'အဆင့်မြင့် 3D ဆိုက်ဘာပန့်ခ် တိုက်ခိုက်ရေးဂိမ်း',
    language: 'ဘာသာစကား',
    languageName: 'မြန်မာဘာသာ',
    languageSwitch: '🌐 မြန်မာ / EN',
    acknowledge: 'နားလည်လက်ခံပြီး စစ်ဆင်ရေးစတင်မည်',
    close: 'ပိတ်မည်',
    back: 'နောက်သို့',
    loading: 'စတင်ပြင်ဆင်နေသည်...',
    enabled: 'ဖွင့်ထားသည်',
    muted: 'ပိတ်ထားသည်',
    active: 'အလုပ်လုပ်နေသည်',
    off: 'ပိတ်ထားသည်',
    ready: 'အသင့်ဖြစ်ပြီ',
    locked: 'သော့ခတ်ထားသည်',
    stage: 'အဆင့်',

    // Start Screen
    neuralDirectLink: 'နူရယ် တိုက်ရိုက်ချိတ်ဆက်မှု // အပိုင်း ၀၁',
    highFidelityEngine: 'အဆင့်မြင့် နည်းဗျူဟာမြောက် 3D ဆိုက်ဘာ တိုက်ခိုက်ရေး',
    cyberOperative: 'ဆိုက်ဘာ စစ်သည်',
    cyborgNinja: 'ဆိုက်ဘော့ဂ် နင်ဂျာ',
    plasmaKatanaReady: 'ပလာစမာ ဓား အသင့်ရှိသည်',
    biohazardThreat: 'ဇီဝဗိုင်းရပ်စ် အန္တရာယ်',
    mutantSwarm: 'မျိုးဗီဇပြောင်း မူတန်အဖွဲ့',
    adaptiveAIDirector: 'အသိဉာဏ်မြင့် AI ညွှန်ကြားရေးမှူး',
    sectorObjective: 'စစ်ဆင်ရေး ရည်မှန်းချက်',
    quantumExtraction: 'ကွမ်တမ် နည်းပညာဖြင့် လွတ်မြောက်ခြင်း',
    retrieveBioCores: 'ဇီဝ Core (၃) ခု ရှာဖွေသိမ်းဆည်းပါ',
    highScore: 'စံချိန်တင် ရမှတ်',
    peakStreak: 'အမြင့်ဆုံး COMBO',
    initializeDeployment: 'စစ်ဆင်ရေး ချက်ချင်းစတင်မည်',
    howToPlay: 'ကစားနည်း လမ်းညွှန်',
    controlsMove: 'W / A / S / D',
    controlsMoveSub: '၃၆၀° လှုပ်ရှားမှု',
    controlsCombat: 'CLICK / J / K',
    controlsCombatSub: 'ဓားခုတ် & သေနတ်ပစ်',
    controlsDash: 'SPACE / SHIFT',
    controlsDashSub: 'လျှပ်တပြက် ရှောင်တိမ်းခြင်း',
    soundSFX: 'အသံစနစ် (SFX)',
    synthBGM: 'ဆင်းသ် တေးဂီတ',

    // HUD
    integrity: 'အသက်သွေး (HP)',
    score: 'ရမှတ်',
    cores: 'Core များ',
    portalReadyEscape: 'PORTAL ပွင့်ပါပြီ // အမြန်လွတ်မြောက်ပါ',
    portalLocked: 'PORTAL သော့ခတ်ထား // CORE လိုအပ်သည်',
    shield: 'ဒိုင်းကာ',
    overdrive: 'အထူးစွမ်းအား',
    slow: 'အချိန်နှေး',
    guideBtn: 'လမ်းညွှန်',
    combo: 'တွဲလုံး',

    // Boss Emergence & Spawn Clearance
    bossSpawnBlockedTitle: '🚨 လူဆိုးဗိုလ် (BOSS) ထွက်ပေါ်မှု ရပ်တန့်နေပါသည်!',
    bossSpawnBlockedReason: 'မင်းသား (Player) သည် Boss ထွက်ပေါ်မည့် Warp Rift နေရာဗဟိုတွင် သွားရပ်နေသောကြောင့် Quantum Matter ပေါက်ကွဲမှုမဖြစ်စေရန် Boss မထွက်ပေါ်သေးပါ။',
    bossSpawnBlockedAction: '👉 Boss ထွက်ပေါ်လာစေရန် အချက်ပြစက်ဝန်း (Hazard Circle) အပြင်ဘက်သို့ အနည်းငယ် နောက်ဆုတ်ပေးပါ!',
    bossSpawnImminent: '⚡ [လူဆိုးဗိုလ် ထွက်ပေါ်လာတော့မည်!]',
    bossSpawnImminentSub: 'နေရာရှင်းလင်းသွားပါပြီ — စစ်ဗျူဟာပြင်ဆင်ထားပါ! ရောက်ရှိရန် စက္ကန့်:',
    bossWarpStabilizing: 'အတိုင်းအတာ တည်ငြိမ်လာနေသည်',
    bossEmergedTitle: '👑 လူဆိုးဗိုလ် APEX TITAN ထွက်ပေါ်လာပါပြီ! အပြင်းအထန် တိုက်ခိုက်ပါ!',

    // Weapons
    weaponKatana: 'ပလာစမာ ဓားရှည်',
    weaponKatanaDesc: '၁၈၀ ဒီဂရီ အနီးကပ် ၃ ဆင့် ခုတ်ပိုင်းတိုက်ခိုက်နိုင်သော ဓားမြှောင်။',
    weaponBlaster: 'ပလာစမာ ဘလပ်စတာ',
    weaponBlasterDesc: 'အလင်းတန်း လျင်မြန်စွာ ပစ်ခတ်နိုင်သော စွမ်းအင်သေနတ်။',
    weaponSpread: 'ကျည်ပြန့် သေနတ်',
    weaponSpreadDesc: 'ကျည်ဆံများစွာ ပြန့်ကျဲထိမှန်စေသော ရိုင်ဖယ်။',
    weaponLightning: 'လျှပ်စီး သေနတ်',
    weaponLightningDesc: 'ရန်သူအများအပြားကို ကူးစက်ထိမှန်စေသော လျှပ်စစ်ဓာတ်အား။',
    weaponMissiles: 'ပစ်မှတ်ရှာ ဒုံးပျံများ',
    weaponMissilesDesc: 'ရန်သူထံသို့ အလိုအလျောက် ပစ်မှတ်လိုက် ဒုံးပျံအသေးစားများ။',
    weaponVortex: 'ဆွဲငင်အား ဝဲကတော့',
    weaponVortexDesc: 'အနီးနားရှိ ရန်သူအားလုံးကို စုပ်ယူချေမှုန်းသည့် အနက်ရောင်တွင်းနက်။',

    // Pause & Settings
    paused: 'ခေတ္တရပ်နားထားသည်',
    neuralSuspended: 'စစ်ဆင်ရေးကို ခေတ္တရပ်နားထားပါသည်',
    resumeHint: '[SPACE] ကိုနှိပ်ပါ သို့မဟုတ် မျက်နှာပြင်ကို ထိပါ',
    resumeRun: 'ဂိမ်းကို ပြန်လည်ဆက်လက်ကစားမည်',
    settings: 'ဆက်တင်များ',
    quitGame: 'ပင်မစာမျက်နှာသို့ ထွက်မည်',
    systemConfig: 'စနစ် ဆက်တင်များ',
    neuralInterfaceSettings: 'မျက်နှာပြင်နှင့် အသံ ထိန်းချုပ်မှုများ',
    sfxDesc: 'Web Audio dynamic အသံထွက်စနစ်',
    musicDesc: 'Synthwave အီလက်ထရွန်းနစ် တေးဂီတနောက်ခံ',
    crtScanlines: 'CRT တီဗွီလိုင်း အထူးပြုလုပ်ချက်',
    crtScanlinesDesc: 'Retro Arcade စတိုင်လ် လိုင်းရိပ်အလွှာ',
    languageSelect: 'ဂိမ်း ဘာသာစကား',
    languageSelectDesc: 'မြန်မာဘာသာ နှင့် အင်္ဂလိပ်ဘာသာ အလွယ်တကူ ပြောင်းလဲနိုင်ပါသည်',
    returnToPause: 'ခေတ္တရပ်နား မီနူးသို့ ပြန်သွားမည်',

    // Game Over & Results
    gameOver: 'ကျရှုံးပါပြီ',
    systemCrash: 'စနစ်ချို့ယွင်းမှု // နယ်မြေသိမ်းပိုက်ခံရသည်',
    runTerminated: 'စစ်ဆင်ရေး ရပ်ဆိုင်းသွားပါပြီ • ပြန်လည်စတင်ရန် REBOOT ကိုနှိပ်ပါ',
    newHighScore: 'စံချိန်တင် စံချိန်သစ် ရရှိပါပြီ!',
    currentSessionScore: 'ယခုပွဲ ရမှတ်',
    allTimeHighScore: 'အမြင့်ဆုံး စံချိန်ဟောင်း',
    distance: 'သွားခဲ့သည့် ခရီး',
    dataCores: 'ရရှိခဲ့သော Core',
    rebootSession: 'ဂိမ်း အသစ်ပြန်လည်စတင်မည်',
    stageClear: 'အဆင့် အောင်မြင်ပါသည်',
    proceedNextStage: 'နောက်တစ်ဆင့်သို့ ဆက်သွားမည်',
    victoryTitle: 'စစ်ဆင်ရေး အပြီးသတ် အောင်မြင်ပါသည်!',
    playAgain: 'ထပ်မံကစားမည်',
    pitfallWarning: '⚠️ သတိပေးချက် // အောက်ခြေမဲ့ ချောက်နက်ထဲသို့ ပြုတ်ကျနေသည်!',
    pitfallSub: 'ပျက်စီးနေသော ကြမ်းခင်းကျိုးပေါက်မှု • အရှိန်ပြင်းစွာ ထိုးဆင်းနေသည်',
    pitfallDepth: 'ချောက်နက် အနက်',
    pitfallVelocity: 'ပြုတ်ကျမှု အရှိန်',
    pitfallTerminal: 'အန္တရာယ်ရှိ အရှိန်သို့ ရောက်ရှိ // ကယ်ဆယ်၍ မရနိုင်တော့ပါ',
    pitfallCauseOfDeathTitle: '⚠️ သေဆုံးရသည့်အကြောင်း: ပျက်စီးနေသော ကြမ်းခင်း ချောက်နက်ထဲ ပြုတ်ကျခြင်း',
    pitfallCauseOfDeathDesc: 'ပျက်စီးကျိုးပေါက်နေသော ကြမ်းခင်းကို မရှောင်တိမ်းနိုင်ဘဲ ချောက်နက်ထဲသို့ အရှိန်ပြင်းစွာ ပြုတ်ကျ သေဆုံးခဲ့ရပါသည်',
    pitfallCauseOfDeathTip: '💡 အကြံပြုချက်: ကျိုးပေါက်နေသော ကြမ်းပြင်များကို Dash (Space / Shift သို့မဟုတ် Dash ခလုတ်) ဖြင့် လေထဲမှ အလွယ်တကူ ခုန်ကူးကျော်လွှားနိုင်ပါသည်!',

    // Guide
    guideProtocol: 'နည်းဗျူဟာ လမ်းညွှန် // အဆင့်မြင့် ပရိုမန်နျူရယ်',
    guideTitle: 'တိုက်ခိုက်ရေးနှင့် အသက်ရှင်သန်ရေး လမ်းညွှန်',
    tabOverview: '၁။ အထွေထွေ မိတ်ဆက်',
    tabControls: '၂။ ထိန်းချုပ်မှုနှင့် လက်နက်များ',
    tabAIRules: '၃။ အဆင့်မြင့် AI စည်းမျဉ်းများ',
    tabProTips: '၄။ အနိုင်ရရေး လျှို့ဝှက်နည်းများ',

    guideOverviewTitle: 'နီယွန် ကွာရန်တင်း စစ်ဆင်ရေး မူဘောင်',
    guideOverviewText: 'Remix Neon Cyber Runner 2 တွင် သင်သည် မျိုးဗီဇပြောင်း မူတန်ဗိုင်းရပ်စ်အဖွဲ့များ သိမ်းပိုက်ထားသော ဆိုက်ဘာမြို့တော်အတွင်းသို့ စေလွှတ်ခံရသည့် ဆိုက်ဘာစစ်သည်တစ်ဦး ဖြစ်ပါသည်။ သင်၏ အဓိကတာဝန်မှာ ရန်သူများကို နှိမ်နင်းပြီး၊ ဇီဝ Bio-Core (၃) ခုကို ရှာဖွေသိမ်းဆည်းကာ လွတ်မြောက်ရေး Portal ပွင့်ပါက ဘေးကင်းစွာ ထွက်ခွာလွတ်မြောက်ရန် ဖြစ်ပါသည်။',
    guideAINeuralTitle: 'အချိန်နှင့်တပြေးညီ အသိဉာဏ်ရှိသော AI ညွှန်ကြားရေးမှူး',
    guideAINeuralDesc: 'ရန်သူများသည် သင်၏ တိုက်ခိုက်ပုံအမူအကျင့်များကို အမြဲလေ့လာမှတ်သားနေပြီး ခလုတ်တစ်ခုတည်း ထပ်ခါထပ်ခါနှိပ်တိုက်ခိုက်ခြင်းကို ဒဏ်ကြေးချမှတ်ကာ၊ ရှောင်တိမ်းခြင်း/ခုခံကာကွယ်ခြင်းများ ပြုလုပ်ပါမည်။',
    guideRhythmTitle: 'တေးဂီတ စည်းချက်အလိုက် တိုက်ခိုက်မှု (Rhythm Combat)',
    guideRhythmDesc: 'ဓားခုတ်ခြင်း၊ ဒက်ရှ်ရှောင်ခြင်းနှင့် စွမ်းရည်အားလုံးသည် ၁၂၀-၁၄၀ BPM ဆင်းသ်ဝေ့ဖ် သီချင်းစည်းချက်နှင့် ချိတ်ဆက်ထားပါသည်။ စည်းချက်နှင့် ကွက်တိတိုက်ခိုက်ပါက ၃.၅ ဆ အထိ Critical Burst Multiplier စွမ်းအားရရှိပါမည်။',

    guideKatanaTitle: 'ဓားခုတ် // ပလာစမာ နင်ဂျာဓားရှည်',
    guideKatanaKeys: 'ဘယ်ကလစ် / J ခလုတ် / ဖုန်းစခရင်',
    guideKatanaDesc: '၁၈၀ ဒီဂရီ ရှေ့မျက်နှာစာ ဧရိယာအပြည့် ၃ ဆင့် အပြင်းအထန် ခုတ်ပိုင်းတိုက်ခိုက်ပါသည်။ စည်းချက်ကျကျ ခုတ်ပါက သာမန်မူတန်များကို တစ်ချက်တည်းဖြင့် ချက်ချင်းချေမှုန်းနိုင်ပါသည်။',
    guideBlasterTitle: 'သေနတ်ပစ် // အဆင့်မြင့် စွမ်းအင်လက်နက်တိုက်',
    guideBlasterKeys: 'ညာကလစ် / K ခလုတ်',
    guideBlasterDesc: 'လက်ရှိတပ်ဆင်ထားသော သေနတ်ဖြင့် အဝေးပစ်တိုက်ခိုက်ပါသည် (ပလာစမာ၊ ကျည်ပြန့်၊ လျှပ်စီး၊ ဒုံးပျံ သို့မဟုတ် ဆွဲငင်အားဝဲကတော့)။ စွမ်းအင်ဆဲလ်ကို အသုံးပြုပါသည်။',
    guideDashTitle: 'ဒက်ရှ်ရှောင်တိမ်း // အသံထက်မြန်သော Phase Dash',
    guideDashKeys: 'SPACE / SHIFT ခလုတ်',
    guideDashDesc: 'မထိခိုက်နိုင်သော အကာအကွယ် (Invulnerability Frames) ဖြင့် ရှေ့သို့ အလျင်အမြန် ပြေးထွက်ပါသည်။ ရန်သူ့ကျည်ဆန်မိုးများနှင့် ကြမ်းပြင်ပေါက် ချောက်တွင်းများကို ဖြတ်ကျော်ခုန်ကူးနိုင်ပါသည်။',
    guideStealthTitle: 'ကုန်းလျှောက်ခြင်း & အသံတိတ် သုတ်သင်ခြင်း',
    guideStealthKeys: 'C ခလုတ် / SNEAK ခလုတ်',
    guideStealthDesc: 'ကုန်းလျှောက်ခြင်းဖြင့် ခြေသံလှိုင်းကို ထက်ဝက်လျှော့ချနိုင်ပြီး ရန်သူမသိအောင် အနောက်မှ အသံတိတ် Cyber Takedown ဖြင့် တစ်ချက်တည်း အပြီးသတ် သုတ်သင်နိုင်ပါသည်။',

    guideRule1Title: '၁။ ကွန်ဘို ခလုတ်အလှည့်အပြောင်းနှင့် ခလုတ်တစ်ခုတည်းမနှိပ်ရန် စည်းမျဉ်း',
    guideRule1Desc: 'ခလုတ်တစ်ခုတည်းကိုသာ ထပ်ခါထပ်ခါ ဆက်တိုက်နှိပ်ခြင်း (ဥပမာ ဘယ်ကလစ်ချည်းသာ နှိပ်ခြင်း) ကို ပြင်းထန်စွာ ဒဏ်ကြေးသတ်မှတ်ထားပြီး Attack Damage သည် ၂၅%-၄၀% သို့ ကျဆင်းသွားပါမည်။',
    guideRule1Tip: '⚡ အပြင်းထန်ဆုံး ၂.၅ ဆ Critical Finisher ရရှိရန် ခလုတ်များကို အလှည့်ကျသုံးပါ - [⚔️ ဓားခုတ် Slash] ➔ [🔫 သေနတ်ပစ် Shoot] ➔ [⚡ ရှောင်တိမ်း Dash/Crouch/Hack] = 💥 ၂.၅ ဆ အထူးထိခိုက်မှု ထွက်ပေါ်ပါမည်!',
    guideRule2Title: '၂။ ရန်သူ AI ၏ ၇၅% ကြိုတင်ခန့်မှန်း ခုခံ/ရှောင်တိမ်းမှု',
    guideRule2Desc: 'တူညီသော တိုက်ခိုက်မှုပုံစံကို ထပ်ခါတလဲလဲ ပြုလုပ်ပါက ရန်သူသည် ၇၅% အခွင့်အလမ်းဖြင့် သင့်နောက်ဆုံး ကွန်ဘိုကို ကြိုတင်ခန့်မှန်းပြီး အောက်ပါအတိုင်း တုံ့ပြန်ပါမည် -',
    guideRule2Evade: '💨 ကြိုတင်ရှောင်တိမ်းခြင်း (Predictive Evasion Dash)',
    guideRule2EvadeDesc: 'ရန်သူသည် သင့်ဓားသွားလမ်းကြောင်းမှ ချက်ချင်း အဝေးသို့ ဒက်ရှ်ပြေးထွက်ပြီး ဒဏ်ရာမရအောင် အပြည့်အဝ ရှောင်တိမ်းသွားပါမည်။',
    guideRule2Block: '🛡️ ဒိုင်းကာကာကွယ်ခြင်း (Predictive Defensive Block)',
    guideRule2BlockDesc: 'ရန်သူသည် ခိုင်မာသော ဇီဝဒိုင်းကို ထောင်လိုက်ပြီး incoming damage ၏ ၈၅% ကို ကာကွယ်ကာ တွန်းကန်လှိုင်းထုတ်လွှတ်ပါမည်။',
    guideRule3Title: '၃။ ကြမ်းပြင်ပေါက်များ၊ ချောက်တွင်းများနှင့် အန္တရာယ်ဇုန်များ',
    guideRule3Desc: 'ဗိုင်းရပ်စ်ပိုးများသည် တွင်းနက်များနှင့် ပေါက်ကွဲကျိုးပဲ့နေသော ကြမ်းပြင်များကို အာရုံခံသိရှိနိုင်ပါသည် -',
    guideRule3P1: '⚠️ သတိပြုရန် - ကစားသမားသည် ကျိုးပေါက်နေသော ချောက်တွင်း (Chasm Void) ထဲသို့ ပြုတ်ကျသွားပါက ချက်ချင်း သေဆုံးပါမည်။',
    guideRule3P2: 'ရန်သူများသည် ချောက်ထဲသို့ မကျဘဲ ဘေးမှ လှည့်ပတ်လာပါမည်။ ကစားသမားနှင့် ရန်သူကြား ချောက်တွင်းခြားနေပါက ရန်သူသည် ချောက်ကို ဖြတ်၍ ၂ စက္ကန့်လျှင် တစ်ကြိမ် အက်ဆစ်အရည်ဖြင့် လှမ်းပစ်ပါမည်။ လိမ္မော်ရောင် နီယွန်မီးတိုင်များကို သတိပြုပါ။',
    guideRule4Title: '၄။ အချိန်ဆွဲခြင်း တားဆီးမှု စနစ် (Executioner Protocol)',
    guideRule4Desc: 'တစ်နေရာတည်းတွင် မလှုပ်မယှက် ၁.၅ စက္ကန့်ထက်ပို၍ ငြိမ်နေပါက Executioner Protocol စတင်ပါမည် -',
    guideRule4P1: 'အဝေးပစ် ရန်သူများသည် သင် ရွေ့လျားမည့် လမ်းကြောင်းကို တွက်ချက်၍ အမြောက်ကျည်ဆန်များ မိုးရွာသလို ပစ်ခတ်ပါမည်။',
    guideRule4P2: 'မျက်နှာပြင်တွင် အနီရောင်ဖိအားလိုင်း (Crimson Vignette) ပေါ်လာမည်ဖြစ်ပြီး ဒက်ရှ်ရှောင်တိမ်းခြင်း သို့မဟုတ် တိုက်ခိုက်ခြင်း ပြုလုပ်မှသာ ပျောက်ကွယ်သွားပါမည်။',

    guideTip1Title: 'တိုက်ခိုက်မှု ကွန်ဘိုကို အမြဲပြောင်းလဲပါ',
    guideTip1Desc: 'တူညီသော လှုပ်ရှားမှုကို ၂ ကြိမ်ဆက်တိုက် မလုပ်ပါနှင့်။ ဓားခုတ် ➔ သေနတ်ပစ် ➔ ရှောင်တိမ်း ➔ ဓားခုတ် စသည်ဖြင့် ရောနှောအသုံးပြုပါက ရန်သူ၏ ကာကွယ်မှုကို ကျော်လွှားနိုင်ပါမည်။',
    guideTip2Title: 'ရန်သူ့ Parry Stance ကို စောင့်ဆိုင်းပြီး တန်ပြန်တိုက်ခိုက်ပါ',
    guideTip2Desc: 'အဆင့်မြင့် ရန်သူများ ရွှေရောင်လင်းလက်သော Parry Stance ယူထားစဉ် ဓားမခုတ်ပါနှင့်။ ၎င်းတို့၏ ကာကွယ်မှု ကျသွားသည့်အချိန် သို့မဟုတ် အနောက်ဘက်သို့ Phase Dash ဖြင့် ရောက်အောင်သွားပြီးမှ အနီးကပ် ချေမှုန်းပါ။',
    guideTip3Title: 'အနီရောင် ဖိအားလိုင်း ပေါ်လာပါက ချက်ချင်း တိုက်ခိုက်/ဒက်ရှ်လုပ်ပါ',
    guideTip3Desc: 'မျက်နှာပြင်တွင် အနီရောင်လိုင်းများ ပေါ်လာပါက ချက်ချင်း ဒက်ရှ်ပြေးခြင်း သို့မဟုတ် ရန်သူကို ထိမှန်အောင် တိုက်ခိုက်ခြင်းဖြင့် အမြောက်မိုးရွာကျမှုကို ရပ်တန့်စေနိုင်ပါသည်။',
    guideTip4Title: 'တေးဂီတ စည်းချက်နှင့်အညီ တိုက်ခိုက်၍ ၃.၅ ဆ ထိခိုက်မှု ရယူပါ',
    guideTip4Desc: 'HUD ပေါ်ရှိ မီးလင်းနေသော မက်ထရိုနုမ်း သင်္ကေတ သို့မဟုတ် နောက်ခံသီချင်း၏ Bass စည်းချက်နှင့်အညီ ထိုးနှက်ပါက ပိုမိုပြင်းထန်သော Critical Damage ကို ရရှိစေပါမည်။',

    // Multiplayer & Vercel
    multiplayerTitle: 'အဖွဲ့လိုက် မာလ်တီပလေယာ စစ်ဆင်ရေး',
    multiplayerSubtitle: 'ဆာဗာမဲ့ WebRTC P2P တိုက်ရိုက်ချိတ်ဆက်မှု ကွန်ရက်',
    soloPlay: 'တစ်ဦးတည်း ကစားမည်',
    multiplayerCoop: 'အဖွဲ့လိုက် ကစားမည် (CO-OP)',
    hostRoom: 'အခန်းအသစ် ဖွင့်မည် (HOST)',
    joinRoom: 'အခန်းသို့ ဝင်ရောက်မည် (JOIN)',
    roomCode: 'အခန်းကုဒ်',
    enterRoomCode: 'အခန်းကုဒ် ၄ လုံး ရိုက်ထည့်ပါ',
    runnerCallsign: 'ကစားသမား အမည်',
    copyInviteLink: 'ဖိတ်ခေါ်လင့်ခ် ကူးယူမည်',
    inviteLinkCopied: 'လင့်ခ်ကို ကူးယူပြီးပါပြီ!',
    connectedRunners: 'ချိတ်ဆက်ထားသော ရဲဘော်များ',
    waitingForTeammates: 'အခြားကစားသမားများ ဝင်ရောက်လာရန် စောင့်ဆိုင်းနေပါသည်...',
    launchMission: 'စစ်ဆင်ရေး စတင်ကစားမည်',
    leaveRoom: 'အခန်းမှ ထွက်မည်',
    vercelGuideBtn: 'VERCEL သို့ တင်နည်း လမ်းညွှန်',
    vercelGuideTitle: 'VERCEL သို့ 1-CLICK DEPLOY ပြုလုပ်နည်း လမ်းညွှန်',
    tacticalComms: 'အဖွဲ့တွင်း အချက်ပြ ဆက်သွယ်ရေး',
    tacticalPing: 'စစ်ဗျူဟာ အချက်ပြ (PING)',
    multiplayerSquad: 'အဖွဲ့လိုက် ကစားမည်',
    vercelDeployGuide: 'VERCEL တင်ရန် လမ်းညွှန်',
  },
};

export function getTranslation(lang: Language = 'MY'): TranslationDictionary {
  return translations[lang] || translations.MY;
}
