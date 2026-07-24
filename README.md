# JobFill — Smart Job Application Auto-Fill Extension

A **Chrome / Edge browser extension** that detects job application form fields and fills them instantly with your stored profile. Works on Greenhouse, Lever, Workday, Google Forms, LinkedIn Easy Apply, and any standard HTML form.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **One-time profile setup** | Fill your details once in the beautiful dark popup |
| **Smart Resume Parser** | Upload PDF/TXT or paste text → auto-extracts 15+ fields and 200+ tech skills |
| **Competitive Programming** | LeetCode, Codeforces, CodeChef |
| **Projects & Portfolio** | Auto-extracts up to 3 project URLs + your main Portfolio link |
| **Social & Profiles** | LinkedIn, GitHub, Resume URL |
| **Smart field detection** | Reads `name`, `id`, `placeholder`, `autocomplete`, `aria-label`, parent `<label>`, and DOM context |
| **React / Vue / Angular support** | Uses native property setters + event dispatch for SPA frameworks |
| **Floating Auto-Fill button** | Appears bottom-right on any detected form — one click to fill |
| **⚡ Fill Now** | Fill from popup without clicking the page FAB |
| **Dynamic form support** | MutationObserver watches SPAs and multi-step forms |
| **100% local** | All data stored in `chrome.storage.local` — nothing sent externally |

---

## 🚀 Installation (3 Steps)

### Step 1 — Generate Icons
Right-click `create_icons.ps1` → **Run with PowerShell**

This creates `icons/icon16.png`, `icon48.png`, `icon128.png`.

### Step 2 — Load in Chrome / Edge
1. Open **`chrome://extensions`** (or `edge://extensions`)
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the **`formautofill extension`** folder

### Step 3 — Set Up Your Profile
1. Click the **JobFill ✨** icon in the toolbar
2. **Option A — Manual**: Fill each tab (Personal, Links, Work, Education, Skills)
3. **Option B — Resume Parser**: Go to the **Resume** tab → **Upload PDF/TXT** or paste text → click **Parse Resume**
4. Click **💾 Save Profile**

---

## 🧠 Resume Parser

The built-in parser extracts the following from your resume:

- **Name** (heuristic: first capitalized multi-word line)
- **Email**, **Phone**, **Location** (city, state)
- **Tech Stack / Technical Skills** (Scans against 200+ languages, frameworks, cloud, databases, tools)
- **Competitive Programming** (LeetCode, Codeforces, CodeChef)
- **Portfolio & Projects** (Smart deduplication and extraction of up to 3 custom project URLs + Portfolio)
- **LinkedIn & GitHub**
- **Degree** (B.Tech, B.S., M.S., MBA, Ph.D., …)
- **Field of Study** (Computer Science, Data Science, …)
- **GPA / CGPA** & **Graduation Year**
- **Current Role** & **Years of Experience**

> **Tip**: You can now upload your `.pdf` directly to the extension for instant parsing without having to open the file!

---

## 🎯 Supported Form Fields

| Category | Fields Detected |
|----------|----------------|
| Identity | First Name, Last Name, Full Name |
| Contact | Email, Phone, Mobile |
| Location | City, State/Province, Country, ZIP |
| Tech & Profiles | LinkedIn, GitHub, Portfolio, Resume URL |
| Competitive | LeetCode, Codeforces, CodeChef |
| Projects | Project 1 URL, Project 2 URL, Project 3 URL |
| Professional | Current Title, Desired Role, Years of Experience, Salary |
| Work Auth | Authorization status, Visa sponsorship |
| Education | Degree, Major, University, GPA, Graduation Year |
| Other | Cover Letter, Professional Summary, Tech Stack (Skills) |

---

## 🗂️ Project Structure

```
formautofill extension/
├── manifest.json               ← Chrome Extension Manifest V3
├── create_icons.ps1            ← Run once to generate PNG icons
├── background/
│   └── service_worker.js       ← Badge updates
├── content/
│   ├── content.js              ← Form detection & auto-fill logic
│   └── content.css             ← FAB button & field highlight styles
├── popup/
│   ├── popup.html              ← 6-tab profile editor
│   ├── popup.css               ← Premium dark UI
│   └── popup.js                ← Profile mgmt + resume parser
└── icons/
    ├── icon16.png  ← generated
    ├── icon48.png  ← generated
    └── icon128.png ← generated
```

---

## 🔧 Platform Compatibility

| Platform | Support |
|----------|---------|
| Standard HTML forms | ✅ Full |
| Google Forms | ✅ Full |
| Greenhouse | ✅ Full |
| Lever | ✅ Full |
| React / Vue / Angular forms | ✅ Full (native event dispatch) |
| Workday | ⚠️ Partial (shadow DOM) |
| LinkedIn Easy Apply | ⚠️ Partial (iframe) |

---

## 🔒 Privacy

All profile data is stored **locally** using `chrome.storage.local`.  
No data is transmitted to any external server.
