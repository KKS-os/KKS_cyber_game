# KKS Cyberpunk: Neon Anti-Virus 🎮⚡

> **အဆင့်မြင့် 3D ဆိုက်ဘာ နီယွန် ဗိုင်းရပ်စ်နှိမ်နင်းရေး တိုက်ခိုက်ရေးဂိမ်း (Tactical 3D Cyberpunk Anti-Virus Action)**
> Built with React 19, TypeScript, Three.js, Vite, Tailwind CSS, and Firebase Firestore Real-Time Squad Co-Op.

---

## 🌟 အဓိကလုပ်ဆောင်ချက်များ (Key Features)

1. **🔥 Firebase Firestore Real-Time Squad Co-Op Multiplayer:**
   - အွန်လိုင်းတွင် အခန်းအသစ်ဖွင့်ခြင်း (Host Room)၊ တိုက်ရိုက်ဝင်ရောက်ကစားခြင်း (Live Lobby Quick Join)။
   - အဖွဲ့သားများ၏ တည်နေရာ၊ ဓားခုတ်မှု၊ လေဆာပစ်ခတ်မှုနှင့် ကျန်းမာရေးကို အချိန်နှင့်တပြေးညီ ချိတ်ဆက်ထားခြင်း။
   - Tactical Squad Pings စနစ်ဖြင့် မြေပုံပေါ်တွင် အချက်ပြသင်္ကေတများ (Danger, Regroup, Assist) ပို့လွှတ်နိုင်ခြင်း။
2. **⚔️ Visceral Combat Matrix & 5-Tier Combo System:**
   - Plasma Katana (3-Stage melee with 180° sweep), Plasma Blaster, Tri-Spread Scatter Cannon။
   - Frame-perfect Counter Parry (ရွှေရောင် ပြန်လှန်ခုခံတိုက်ခိုက်မှု)။
   - ၅ ဆင့် ကွန်ဘိုစနစ် (Cyan ➔ Gold ➔ Hyper Pink ➔ Ultra Violet ➔ GODLIKE Prismatic)။
3. **🏃 4 Adaptive Evasion Maneuvers:**
   - Phase Dash (12 Invulnerability I-Frames), Combat Slide (Crouch under lasers), Tactical Cover (80% damage reduction), Double-Jump over abysses.
4. **📱 Responsive Full-Screen Mobile & PC Ergonomics:**
   - မိုဘိုင်းလ်ဖုန်းတွင် Portrait (ဒေါင်လိုက်) ရော Landscape (အလျားလိုက်) ပါ အချိုးကျ မျက်နှာပြင်အပြည့် ကစားနိုင်ခြင်း။
   - Notch / Dynamic Island Safe-Area Inset ကာကွယ်မှု။
   - လက်မနှစ်ဖက် အလွယ်တကူ ထိန်းချုပ်နိုင်သည့် 360° Virtual Joystick နှင့် Ergonomic Thumb Arc Action Buttons။

---

## 🚀 GitHub နှင့် Vercel ပေါ်သို့ လွှင့်တင်နည်း (Deployment Guide)

### ၁။ GitHub သို့ ကုဒ်များ Push ပြုလုပ်ခြင်း (Step 1: Push to GitHub)

Terminal ဖွင့်၍ အောက်ပါ command များကို အစဉ်လိုက် ရိုက်ထည့်ပါ-

```bash
# 1. Git စတင်သတ်မှတ်ခြင်း
git init

# 2. ဖိုင်အားလုံးကို Add လုပ်ခြင်း
git add .

# 3. Commit ပြုလုပ်ခြင်း
git commit -m "feat: KKS Cyberpunk: Neon Anti-Virus v2.5 release"

# 4. Main branch သတ်မှတ်ခြင်း
git branch -M main

# 5. သင့် GitHub Repository နှင့် ချိတ်ဆက်ခြင်း (YOUR_USERNAME နေရာတွင် သင့် username ထည့်ပါ)
git remote add origin https://github.com/YOUR_USERNAME/kks-cyberpunk-neon-antivirus.git

# 6. GitHub သို့ Push တင်ခြင်း
git push -u origin main
```

---

### ၂။ Vercel ပေါ်တွင် ၁ မိနစ်အတွင်း တိုက်ရိုက် Deploy လုပ်ခြင်း (Step 2: Deploy to Vercel)

ဤပရောဂျက်တွင် `vercel.json` ကို အသင့်ထည့်သွင်းပြင်ဆင်ပေးထားသောကြောင့် မည်သည့် Configuration မှ ပြောင်းလဲစရာမလိုဘဲ အောက်ပါအတိုင်း လွယ်ကူစွာ Deploy နိုင်ပါသည်-

#### နည်းလမ်း (A) - Vercel Dashboard ဖြင့် တင်နည်း (အလွယ်ဆုံး):
1. [vercel.com/new](https://vercel.com/new) သို့ သွား၍ သင့် GitHub အကောင့်ဖြင့် Login ဝင်ပါ။
2. ခုနက တင်ထားသော `kks-cyberpunk-neon-antivirus` repository ကို **Import** နှိပ်ပါ။
3. Framework Preset တွင် **Vite** ဟု အလိုအလျောက် ပေါ်နေမည်ဖြစ်ပြီး Build Command သည် `npm run build` ဖြစ်နေပါမည်။
4. **Deploy** ခလုတ်ကို နှိပ်လိုက်ပါ။ စက္ကန့် ၄၀ အတွင်း Live Production URL (ဥပမာ `https://your-game.vercel.app`) ရရှိမည် ဖြစ်ပါသည်။

#### နည်းလမ်း (B) - Vercel CLI ဖြင့် တင်နည်း (Alternative):
```bash
npx vercel --prod
```

---

## 🔒 GitHub ပေါ်တင်ရာတွင် လုံခြုံစိတ်ချစေရန် စစ်ဆေးနည်းနှင့် မလုံခြုံသောဖိုင်များ ဖြုတ်နည်း (Security Guide)

GitHub ပေါ်သို့ သင့်ကုဒ်များကို တင်ရာတွင် လုံခြုံရေးအရ စိတ်ချရစေရန် အောက်ပါအချက်များကို ပြင်ဆင်စီမံပေးထားပါသည်-

### ၁။ အလိုအလျောက် ပိတ်ပင်ထားသော ဖိုင်များ (.gitignore Hardening)
- `.env`, `.env.local`, `.env.*.local` (Local API Keys နှင့် Secrets များ)
- `*.pem`, `*.key`, `*.cert` (Private Certificates များ)
- `*serviceAccount*.json`, `*credentials*.json` (Cloud Admin Keys များ)
- `node_modules/`, `dist/`, `.vercel/` (Build & Cache ဖိုင်များ)

### ၂။ မတော်တဆ Git ထဲ ထည့်မိထားသော ဖိုင်များကို GitHub မှ ဖြုတ်နည်း (Untrack Files)
အကယ်၍ သင့်ကွန်ပျူတာထဲရှိ လျှို့ဝှက်ဖိုင်တစ်ခုခု (ဥပမာ `.env` သို့မဟုတ် config) ကို `git add .` ဖြင့် မှားယွင်းထည့်မိပါက ကွန်ပျူတာထဲမှ file မပျက်စေဘဲ Git repository မှ ဖြုတ်ရန် အောက်ပါ command ကို သုံးပါ-

```bash
# Git tracking မှ ဖယ်ရှားခြင်း (Local ဖိုင် မပျက်ပါ)
git rm --cached firebase-applet-config.json
git rm --cached .env

# Commit ပြန်လည်ပြင်ဆင်ခြင်း
git commit -m "chore: remove sensitive config from git tracking"
git push origin main
```

### ၃။ Git History ထဲမှ လုံးဝ ခြေရာဖျောက်လိုပါက
အကယ်၍ ယခင် commit အဟောင်းများထဲတွင် လျှို့ဝှက် key တစ်ခုခု ပါသွားခဲ့ပါက အောက်ပါအတိုင်း နောက်ဆုံး commit ကို ပြင်နိုင်ပါသည်-
```bash
# နောက်ဆုံး commit ကို အသစ်ပြင်ဆင်ခြင်း
git commit --amend --no-edit
git push origin main --force
```

### ၄။ Zero-Trust Firestore Rules အကာအကွယ်
ဤဂိမ်း၏ Firebase Firestore တွင် **`firestore.rules` (Default-Deny Zero-Trust)** ကို Deploy လုပ်ထားသောကြောင့် Repository ကို Public ထားလျှင်ပင် မသမာသူများက အခြားသူ၏ ရမှတ်များ၊ အခန်းများကို ဖျက်ဆီး/ခိုးယူခြင်း မပြုလုပ်နိုင်အောင် စနစ်တကျ ကာကွယ်ထားပြီး ဖြစ်ပါသည်။

---

## 🎮 ကစားနည်း ထိန်းချုပ်မှုများ (Controls)

| လုပ်ဆောင်ချက် (Action) | PC Keyboard & Mouse | မိုဘိုင်းလ်ဖုန်း (Mobile Touch) |
|---|---|---|
| **၃၆၀° လမ်းလျှောက်/ပြေး (Move)** | `W / A / S / D` သို့မဟုတ် Arrow Keys | ဘယ်ဘက် 360° Joystick |
| **ဓားခုတ်တိုက်ခိုက်မှု (Katana Slash)** | `Left Click` သို့မဟုတ် `J` | ညာဘက် ATTACK ခလုတ် (အကြီး) |
| **စွမ်းအင်သေနတ်ပစ် (Blaster Shoot)** | `Right Click` သို့မဟုတ် `K` | ညာဘက် BLAST ခလုတ် |
| **အသံတိတ်သတ်ဖြတ်မှု (Stealth Takedown)** | `F Key` | TAKEDOWN ခလုတ် |
| **Phase Dash ရှောင်တိမ်းခြင်း** | `Space` သို့မဟုတ် `Shift` | DASH ခလုတ် |
| **Crouch / Slide လျှောတိုက်ခြင်း** | `C Key` | CROUCH ခလုတ် |
| **လက်နက်ပြောင်းလဲခြင်း (Switch Weapon)**| `1`, `2`, `3` Keys | HUD ပေါ်ရှိ လက်နက်အကွက် |
| **Tactical Ping အချက်ပြခြင်း** | `T Key` | HUD ပေါ်ရှိ Ping ခလုတ် |

---

## 🛡️ လိုင်စင်နှင့် နည်းပညာ (Tech Stack)

- **Frontend:** React 19, TypeScript, Three.js WebGL 3D, Tailwind CSS
- **Database & Networking:** Firebase Firestore, Firebase Authentication, PeerJS WebRTC
- **Audio:** Web Audio API Procedural Dynamic Synthesis
