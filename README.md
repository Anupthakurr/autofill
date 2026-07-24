# JobFill — Smart Job Application Auto-Fill Extension

A **Chrome / Edge browser extension** that detects job application form fields and fills them instantly with your stored profile. Works on Greenhouse, Lever, Workday, Google Forms, LinkedIn Easy Apply, and any standard HTML form.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **One-time profile setup** | Fill your details once in the beautiful dark popup |
| **Resume Parser** | Paste resume text → auto-extracts 15+ fields and 200+ tech skills |
| **All social/portfolio links** | LinkedIn, GitHub, Portfolio, Resume URL, Twitter/X, Stack Overflow, Behance, Dribbble, Medium |
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
3. **Option B — Resume Parser**: Go to the **Resume** tab → paste resume text → click **Parse Resume**
4. Click **💾 Save Profile**

---

## 🧠 Resume Parser

The built-in parser extracts the following from plain resume text:

- **Name** (heuristic: first capitalized multi-word line)
- **Email**, **Phone**, **Location** (city, state)
- **LinkedIn**, **GitHub**, **Portfolio**, **Twitter/X**, **Stack Overflow**, **Behance**, **Dribbble**, **Medium**
- **Degree** (B.Tech, B.S., M.S., MBA, Ph.D., …)
- **Field of Study** (Computer Science, Data Science, …)
- **GPA / CGPA**
- **Graduation Year**
- **Current Role** (Software Engineer, Full Stack Developer, …)
- **Years of Experience**
- **200+ tech skills** (languages, frameworks, cloud, databases, tools, ML/AI, …)

> **Tip**: Open your PDF resume → press `Ctrl+A`, `Ctrl+C` → paste in the Resume tab

---

## 🎯 Supported Form Fields

| Category | Fields Detected |
|----------|----------------|
| Identity | First Name, Last Name, Full Name |
| Contact | Email, Phone, Mobile |
| Location | City, State/Province, Country, ZIP |
| Links | LinkedIn, GitHub, Portfolio, Resume URL |
| Social | Twitter/X, Stack Overflow, Behance, Dribbble, Medium |
| Professional | Current Title, Desired Role, Years of Experience, Salary |
| Work Auth | Authorization status, Visa sponsorship |
| Education | Degree, Major, University, GPA, Graduation Year |
| Other | Cover Letter, Professional Summary, Skills |

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
