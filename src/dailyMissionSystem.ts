import { DailyMission, DailyMissionType } from './types';
import { sound } from './audio';

const DAILY_MISSION_STORAGE_KEY = 'cyberrunner_daily_mission_v1';

interface MissionTemplate {
  category: DailyMissionType;
  title: string;
  codeName: string;
  description: string;
  difficulty: 'STANDARD' | 'HARD' | 'APEX_ELITE';
  targetValue: number;
  rewardCredits: number;
  rewardXp: number;
  rewardBadge: string;
  accentColor: string;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    category: 'CHASM_ACROBAT',
    title: 'ABYSS LEAPER',
    codeName: 'DIRECTIVE: VOID_SURGE',
    description: 'Phase-dash safely across 4 broken floor or bottomless chasm gaps.',
    difficulty: 'HARD',
    targetValue: 4,
    rewardCredits: 3500,
    rewardXp: 450,
    rewardBadge: 'ABYSS_WALKER',
    accentColor: '#00FFD1',
  },
  {
    category: 'STEALTH_ASSASSIN',
    title: 'GHOST OPERATIVE',
    codeName: 'DIRECTIVE: SHADOW_STRIKE',
    description: 'Execute 5 silent stealth takedowns or melee katana eliminations.',
    difficulty: 'STANDARD',
    targetValue: 5,
    rewardCredits: 2800,
    rewardXp: 380,
    rewardBadge: 'NEON_BLADE',
    accentColor: '#FF00E5',
  },
  {
    category: 'BIO_CORE_HARVEST',
    title: 'QUANTUM SIPHON',
    codeName: 'DIRECTIVE: CORE_EXTRACTION',
    description: 'Extract 6 Quantum Bio-Cores from heavily guarded hostile sectors.',
    difficulty: 'STANDARD',
    targetValue: 6,
    rewardCredits: 3000,
    rewardXp: 400,
    rewardBadge: 'CORE_HARVESTER',
    accentColor: '#00FF66',
  },
  {
    category: 'COMBO_OVERDRIVE',
    title: 'NEURAL ACCELERATOR',
    codeName: 'DIRECTIVE: HYPER_COMBO',
    description: 'Maintain fluid tactical momentum and achieve a 15x Combo chain.',
    difficulty: 'HARD',
    targetValue: 15,
    rewardCredits: 4000,
    rewardXp: 500,
    rewardBadge: 'OVERDRIVE_CHAMPION',
    accentColor: '#FFE600',
  },
  {
    category: 'ENEMY_PURGE',
    title: 'SECTOR PURIFIER',
    codeName: 'DIRECTIVE: THREAT_PURGE',
    description: 'Neutralize 12 corporate enforcers, drones, or mutant bio-hazards.',
    difficulty: 'STANDARD',
    targetValue: 12,
    rewardCredits: 3200,
    rewardXp: 420,
    rewardBadge: 'APEX_HUNTER',
    accentColor: '#FF0055',
  },
  {
    category: 'CHRONO_SPRINT',
    title: 'VELOCITY BREACH',
    codeName: 'DIRECTIVE: LONG_RANGE_SURVEILLANCE',
    description: 'Traverse over 350 meters across continuous cybernetic sectors.',
    difficulty: 'STANDARD',
    targetValue: 350,
    rewardCredits: 2500,
    rewardXp: 350,
    rewardBadge: 'SECTOR_RUNNER',
    accentColor: '#00D0FF',
  },
  {
    category: 'CYBER_SURVIVOR',
    title: 'IRON OPERATIVE',
    codeName: 'DIRECTIVE: SHIELD_PRESERVATION',
    description: 'Complete Sector 1 and reach Stage 2 with System Integrity above 75%.',
    difficulty: 'APEX_ELITE',
    targetValue: 1,
    rewardCredits: 5000,
    rewardXp: 650,
    rewardBadge: 'TITANIUM_CORE',
    accentColor: '#A855F7',
  },
];

export class DailyMissionManager {
  private activeMission: DailyMission;
  public onMissionUpdated?: (mission: DailyMission) => void;
  public onMissionCompleted?: (mission: DailyMission) => void;

  constructor() {
    this.activeMission = this.loadOrGenerateDailyMission();
  }

  /** Gets today's formatted local date key (YYYY-MM-DD) */
  public static getTodayDateKey(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Simple deterministic string hash */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Generates or retrieves the Daily Mission for today.
   */
  public loadOrGenerateDailyMission(): DailyMission {
    const todayKey = DailyMissionManager.getTodayDateKey();

    try {
      const savedRaw = localStorage.getItem(DAILY_MISSION_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as DailyMission;
        if (parsed && parsed.dateKey === todayKey) {
          return parsed;
        }
      }
    } catch {
      // Storage parsing failed, regenerate
    }

    // Deterministically pick a template based on today's date
    const hash = DailyMissionManager.hashString(todayKey);
    const templateIndex = hash % MISSION_TEMPLATES.length;
    const template = MISSION_TEMPLATES[templateIndex];

    const newMission: DailyMission = {
      id: `daily_${todayKey}_${template.category}`,
      dateKey: todayKey,
      title: template.title,
      codeName: template.codeName,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      targetValue: template.targetValue,
      currentValue: 0,
      isCompleted: false,
      isClaimed: false,
      rewardCredits: template.rewardCredits,
      rewardXp: template.rewardXp,
      rewardBadge: template.rewardBadge,
      accentColor: template.accentColor,
    };

    this.saveMission(newMission);
    return newMission;
  }

  public getActiveMission(): DailyMission {
    // Check if the calendar date rolled over while the game was open
    const todayKey = DailyMissionManager.getTodayDateKey();
    if (this.activeMission.dateKey !== todayKey) {
      this.activeMission = this.loadOrGenerateDailyMission();
      this.onMissionUpdated?.(this.activeMission);
    }
    return this.activeMission;
  }

  /** Save mission to localStorage */
  private saveMission(mission: DailyMission) {
    try {
      localStorage.setItem(DAILY_MISSION_STORAGE_KEY, JSON.stringify(mission));
    } catch {}
  }

  /** Increment or set progress for a mission category */
  public reportProgress(category: DailyMissionType, amount: number = 1, isAbsolute: boolean = false): boolean {
    const mission = this.getActiveMission();
    if (mission.isCompleted || mission.category !== category) {
      return false;
    }

    const prevValue = mission.currentValue;
    if (isAbsolute) {
      mission.currentValue = Math.max(mission.currentValue, amount);
    } else {
      mission.currentValue = Math.min(mission.targetValue, mission.currentValue + amount);
    }

    let newlyCompleted = false;
    if (mission.currentValue >= mission.targetValue && !mission.isCompleted) {
      mission.isCompleted = true;
      newlyCompleted = true;
      sound.playDailyMissionComplete();
      this.saveMission(mission);
      this.onMissionCompleted?.(mission);
    } else if (mission.currentValue > prevValue) {
      sound.playDailyMissionProgress();
      this.saveMission(mission);
    }

    this.saveMission(mission);
    this.onMissionUpdated?.(mission);
    return newlyCompleted;
  }

  /** Claim daily mission rewards */
  public claimReward(): { credits: number; xp: number; badge: string } | null {
    const mission = this.getActiveMission();
    if (!mission.isCompleted || mission.isClaimed) {
      return null;
    }

    mission.isClaimed = true;
    this.saveMission(mission);
    this.onMissionUpdated?.(mission);

    sound.playDailyMissionComplete();
    return {
      credits: mission.rewardCredits,
      xp: mission.rewardXp,
      badge: mission.rewardBadge,
    };
  }

  /** Calculates seconds remaining until midnight reset */
  public static getSecondsUntilMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
  }

  /** Formats seconds into HH:MM:SS */
  public static formatCountdown(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

export const dailyMissionManager = new DailyMissionManager();
