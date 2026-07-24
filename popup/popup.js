// ============================================================
// JobFill — Popup Script
// Profile management + smart resume parser
// ============================================================

'use strict';

// ── Profile Schema ────────────────────────────────────────

const DEFAULT_PROFILE = {
  // Personal
  firstName:          '',
  lastName:           '',
  fullName:           '',  // auto-computed if blank
  email:              '',
  phone:              '',
  city:               '',
  state:              '',
  country:            '',
  zipCode:            '',
  // Links
  linkedin:           '',
  github:             '',
  portfolio:          '',
  resumeUrl:          '',
  leetcode:           '',
  codeforces:         '',
  codechef:           '',
  project1:           '',
  project2:           '',
  project3:           '',
  // Professional
  currentRole:        '',
  desiredRole:        '',
  yearsOfExperience:  '',
  salary:             '',
  workAuthorization:  '',
  requireSponsorship: '',
  summary:            '',
  // Education
  degree:             '',
  institution:        '',
  fieldOfStudy:       '',
  graduationYear:     '',
  gpa:                '',
  // Skills & cover letter handled separately
  skills:             [],
  coverLetter:        '',
};

// IDs of all simple input/select/textarea fields
const FIELD_IDS = Object.keys(DEFAULT_PROFILE).filter(k => k !== 'skills');

// Quick-add suggestion chips
const SKILL_SUGGESTIONS = [
  'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','PHP','Ruby','Swift','Kotlin',
  'React','Vue.js','Angular','Next.js','Svelte','Node.js','Express','NestJS','Django','Flask','FastAPI',
  'HTML5','CSS3','SASS','Tailwind CSS','Bootstrap','Material UI',
  'PostgreSQL','MySQL','MongoDB','Redis','Firebase','Supabase','DynamoDB',
  'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','GitHub Actions','Terraform',
  'Git','REST API','GraphQL','Microservices','WebSockets',
  'React Native','Flutter','Android','iOS',
  'Machine Learning','TensorFlow','PyTorch','Pandas','NumPy','OpenCV','LangChain',
  'Figma','Adobe XD','Photoshop',
  'Agile','Scrum','Jira','Linux','Bash',
];

// ── State ─────────────────────────────────────────────────

let profile  = { ...DEFAULT_PROFILE };
let skills   = [];  // current skills array (separate from profile until save)

// ── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();
  initTabs();
  initSkillsInput();
  initSuggestions();
  initResumeParser();
  document.getElementById('saveBtn').addEventListener('click', saveProfile);
  document.getElementById('fillNowBtn').addEventListener('click', fillCurrentTab);
});

// ── Load / Render ─────────────────────────────────────────

async function loadProfile() {
  try {
    const stored = await chrome.storage.local.get('jobProfile');
    if (stored.jobProfile) {
      profile = { ...DEFAULT_PROFILE, ...stored.jobProfile };
      skills  = Array.isArray(profile.skills) ? [...profile.skills] : [];
    }
  } catch (e) {
    console.error('[JobFill] load error', e);
  }
  renderProfile();
}

function renderProfile() {
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = profile[id] || '';
  });
  renderTags();
}

// ── Save ──────────────────────────────────────────────────

async function saveProfile() {
  const p = { ...DEFAULT_PROFILE };

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) p[id] = el.value.trim();
  });

  p.skills = [...skills];

  // Auto-build fullName if left blank
  if (!p.fullName && p.firstName) {
    p.fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
  }

  try {
    await chrome.storage.local.set({ jobProfile: p });
    profile = p;
    showStatus('✓ Profile saved', 'ok');
  } catch (e) {
    showStatus('✗ Save failed', 'err');
    console.error('[JobFill] save error', e);
  }
}

function showStatus(msg, cls) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = `jf-status ${cls}`;
  clearTimeout(el.__t);
  el.__t = setTimeout(() => {
    el.textContent = '';
    el.className   = 'jf-status';
  }, 3500);
}

// ── Tabs ──────────────────────────────────────────────────

function initTabs() {
  document.querySelectorAll('.jf-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.jf-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.jf-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });
}

// ── Skills Input ──────────────────────────────────────────

function initSkillsInput() {
  const box   = document.getElementById('skillsBox');
  const input = document.getElementById('skillInput');

  // Click anywhere in the box to focus input
  box.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitSkill(input.value);
    }
    if (e.key === 'Backspace' && !input.value && skills.length) {
      removeSkill(skills[skills.length - 1]);
    }
  });

  input.addEventListener('blur', () => {
    if (input.value.trim()) commitSkill(input.value);
  });
}

function commitSkill(raw) {
  const input = document.getElementById('skillInput');
  const val   = raw.replace(/,$/, '').trim();
  if (val) addSkill(val);
  input.value = '';
}

function addSkill(skill) {
  skill = skill.trim();
  if (!skill || skills.some(s => s.toLowerCase() === skill.toLowerCase())) return;
  skills.push(skill);
  renderTags();
  syncChips();
}

function removeSkill(skill) {
  skills = skills.filter(s => s !== skill);
  renderTags();
  syncChips();
}

function renderTags() {
  const container = document.getElementById('skillsTags');
  container.innerHTML = '';
  skills.forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'jf-tag';
    const label = document.createTextNode(skill);
    const btn   = document.createElement('button');
    btn.className = 'jf-tag-rm';
    btn.title     = `Remove ${skill}`;
    btn.textContent = '✕';
    btn.addEventListener('click', e => { e.stopPropagation(); removeSkill(skill); });
    tag.appendChild(label);
    tag.appendChild(btn);
    container.appendChild(tag);
  });
}

// ── Suggestion Chips ──────────────────────────────────────

function initSuggestions() {
  const container = document.getElementById('suggestionChips');
  SKILL_SUGGESTIONS.forEach(s => {
    const chip = document.createElement('button');
    chip.className    = 'jf-chip';
    chip.textContent  = s;
    chip.dataset.skill = s;
    chip.addEventListener('click', () => addSkill(s));
    container.appendChild(chip);
  });
  syncChips();
}

function syncChips() {
  document.querySelectorAll('.jf-chip').forEach(chip => {
    const added = skills.some(s => s.toLowerCase() === chip.dataset.skill.toLowerCase());
    chip.classList.toggle('jf-chip-added', added);
  });
}

// ============================================================
// RESUME PARSER
// Extracts profile fields from plain-text resume content
// ============================================================

// Huge tech-skills list for pattern matching
const TECH_SKILLS = [
  // Languages
  'JavaScript','TypeScript','Python','Java','C','C++','C#','Go','Golang','Rust',
  'PHP','Ruby','Swift','Kotlin','R','Scala','Haskell','Elixir','Dart','Lua',
  'MATLAB','Perl','Bash','Shell','PowerShell','SQL','PL/SQL','COBOL','Fortran',
  'Assembly','Objective-C','Groovy','Clojure','Erlang','F#','Visual Basic','Delphi',
  // Frontend
  'React','Vue','Vue.js','Angular','Svelte','Next.js','Nuxt.js','Gatsby','Remix',
  'Solid.js','Astro','Qwik','AlpineJS','Stimulus','Lit','Web Components',
  'HTML','HTML5','CSS','CSS3','SASS','SCSS','Less','Stylus',
  'Tailwind CSS','Bootstrap','Material UI','Ant Design','Chakra UI',
  'Styled Components','Emotion','CSS Modules','Radix UI','shadcn/ui',
  'jQuery','Backbone.js','Ember.js','Mithril',
  // Backend
  'Node.js','Express','Express.js','NestJS','Fastify','Koa','Hapi','Feathers.js',
  'Django','Flask','FastAPI','Tornado','Pyramid','Starlette',
  'Spring','Spring Boot','Quarkus','Micronaut','Vert.x',
  'Laravel','Symfony','CodeIgniter','Slim','Lumen',
  'Ruby on Rails','Sinatra',
  'ASP.NET','ASP.NET Core','.NET','.NET Core','Blazor','MAUI',
  'Gin','Echo','Fiber','Chi','Gorilla',
  'Actix','Rocket','Axum',
  'Phoenix','Plug',
  // Databases
  'MySQL','PostgreSQL','MongoDB','Redis','SQLite','Firebase','Supabase',
  'DynamoDB','Cassandra','Elasticsearch','OpenSearch','Neo4j','MariaDB',
  'CockroachDB','PlanetScale','Neon','Turso','Convex',
  'Prisma','Sequelize','TypeORM','Mongoose','Drizzle','SQLAlchemy','Hibernate',
  'GraphQL','Apollo','Hasura','tRPC',
  // Cloud & DevOps
  'AWS','Azure','GCP','Google Cloud','Vercel','Netlify','Render','Railway',
  'Heroku','DigitalOcean','Fly.io','Cloudflare','Cloudflare Workers','Fastly',
  'Docker','Kubernetes','Helm','Istio','Envoy',
  'CI/CD','GitHub Actions','GitLab CI','CircleCI','Travis CI','Jenkins','ArgoCD',
  'Terraform','Pulumi','CDK','CloudFormation','Ansible','Chef','Puppet',
  'Prometheus','Grafana','Datadog','New Relic','Sentry','PagerDuty',
  'Nginx','Apache','Caddy','HAProxy','Traefik',
  // Tools & Protocols
  'Git','GitHub','GitLab','Bitbucket','Jira','Confluence','Linear','Notion',
  'VS Code','IntelliJ','PyCharm','WebStorm','Xcode','Android Studio','Eclipse',
  'Webpack','Vite','Rollup','esbuild','Parcel','Babel','SWC',
  'ESLint','Prettier','TSLint','Stylelint','Husky','lint-staged',
  'Jest','Vitest','Mocha','Chai','Jasmine','Karma',
  'Cypress','Playwright','Selenium','Puppeteer','Testing Library',
  'Postman','Insomnia','Swagger','OpenAPI','REST','gRPC','WebSockets',
  'OAuth','JWT','SAML','OpenID Connect','Auth0','Keycloak','Passport.js',
  'Microservices','Event-Driven','CQRS','DDD','Serverless',
  'RabbitMQ','Kafka','NATS','SQS','SNS','Pub/Sub',
  // ML / AI
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras',
  'scikit-learn','Pandas','NumPy','Matplotlib','Seaborn','Plotly',
  'Jupyter','Jupyter Notebook','OpenCV','NLTK','spaCy','Hugging Face',
  'LangChain','LlamaIndex','OpenAI','GPT','LLM','RAG','Vector DB',
  'Pinecone','Weaviate','Chroma','FAISS',
  'NLP','Computer Vision','Data Science','MLOps','Airflow','dbt',
  // Mobile
  'React Native','Flutter','Expo','Capacitor','Ionic','Xamarin','Cordova',
  // Design
  'Figma','Adobe XD','Sketch','InVision','Zeplin','Storybook',
  'Photoshop','Illustrator','After Effects','Framer',
  'UX Design','UI Design','Wireframing','Prototyping','Design Systems',
  // Practices
  'Agile','Scrum','Kanban','SAFe','TDD','BDD','DDD','DevOps','SRE','GitOps',
  'Code Review','Pair Programming','Mob Programming',
  'System Design','Distributed Systems','High Availability',
];

function parseResume(text) {
  const extracted = {};
  const notes     = [];

  if (!text || text.trim().length < 40) {
    return { extracted, notes: ['Resume text is too short — paste the full content.'] };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ── Email ──────────────────────────────────────────────
  const emailM = text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/);
  if (emailM) {
    extracted.email = emailM[0];
    notes.push(`📧 Email: ${emailM[0]}`);
  }

  // ── Phone ──────────────────────────────────────────────
  const phoneM = text.match(
    /(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/
  );
  if (phoneM) {
    extracted.phone = phoneM[0].trim();
    notes.push(`📱 Phone: ${phoneM[0].trim()}`);
  }

  // ── URL pre-processing ─────────────────────────────────
  // PDFs sometimes insert spaces inside URLs during text extraction.
  // Collapse any multi-line URL-like fragments (but don't merge two distinct URLs).
  const cleanText = text.replace(/(https?:\/\/[^\s]+)\s+(?!https?:\/\/)([\w\-./]+)/gi, '$1$2');

  // ── LinkedIn ───────────────────────────────────────────
  const linkedinM = cleanText.match(/linkedin\.com\/in\/([\w%\-]+)/i);
  if (linkedinM) {
    extracted.linkedin = `https://www.linkedin.com/in/${linkedinM[1]}`;
    notes.push(`🔵 LinkedIn: linkedin.com/in/${linkedinM[1]}`);
  }

  // ── GitHub ─────────────────────────────────────────────
  const githubM = cleanText.match(/github\.com\/([\w\-]+)/i);
  const githubSkip = new Set(['sponsors','orgs','marketplace','features','about','login','signup','pricing']);
  if (githubM && !githubSkip.has(githubM[1].toLowerCase())) {
    extracted.github = `https://github.com/${githubM[1]}`;
    notes.push(`⚫ GitHub: github.com/${githubM[1]}`);
  }

  // ── LeetCode ───────────────────────────────────────────
  const leetcodeM = cleanText.match(/leetcode\.com\/(?:u\/)?([\w\-]+)/i);
  if (leetcodeM) {
    extracted.leetcode = `https://leetcode.com/u/${leetcodeM[1]}`;
    notes.push(`🟠 LeetCode: leetcode.com/u/${leetcodeM[1]}`);
  }

  // ── Codeforces ─────────────────────────────────────────
  const codeforcesM = cleanText.match(/codeforces\.com\/profile\/([\w\-]+)/i);
  if (codeforcesM) {
    extracted.codeforces = `https://codeforces.com/profile/${codeforcesM[1]}`;
    notes.push(`🔵 Codeforces: codeforces.com/profile/${codeforcesM[1]}`);
  }

  // ── CodeChef ───────────────────────────────────────────
  const codechefM = cleanText.match(/codechef\.com\/users\/([\w\-]+)/i);
  if (codechefM) {
    extracted.codechef = `https://codechef.com/users/${codechefM[1]}`;
    notes.push(`🟤 CodeChef: codechef.com/users/${codechefM[1]}`);
  }

  // ── Resume / Document link (Google Drive, Dropbox, OneDrive, etc.) ──
  const resumeLinkM = cleanText.match(
    /https?:\/\/(?:drive\.google\.com\/file\/d\/[^\s"'>]+|docs\.google\.com\/[^\s"'>]+|dropbox\.com\/s\/[^\s"'>]+|1drv\.ms\/[^\s"'>]+|onedrive\.live\.com\/[^\s"'>]+)/i
  );
  if (resumeLinkM) {
    extracted.resumeUrl = resumeLinkM[0].replace(/[)\]>'"]+$/, '');
    notes.push(`📎 Resume link: ${extracted.resumeUrl.slice(0, 50)}…`);
  }

  // ── Portfolio / Projects ────────────────────────────────
  const rawUrls = cleanText.match(/https?:\/\/[^\s\)\]>"']+/g) || [];
  // Split URLs if they got concatenated together (e.g. url1.com/https://url2.com/)
  const allUrls = rawUrls.flatMap(url => url.split(/(?=https?:\/\/)/i));
  
  const skipDomains = /linkedin|github|twitter|x\.com|instagram|facebook|youtube|google|drive\.google|dropbox|onedrive|stackoverflow|behance|dribbble|medium|leetcode|codeforces|codechef/i;
  
  // Find all URLs not belonging to standard platforms
  const genericUrls = allUrls
    .filter(u => !skipDomains.test(u))
    .map(u => u.replace(/[)\]>'"]+$/, ''));
    
  // Deduplicate URLs
  const uniqueUrls = [...new Set(genericUrls)];

  if (uniqueUrls.length > 0) {
    extracted.portfolio = uniqueUrls[0];
    notes.push(`🌐 Portfolio: ${extracted.portfolio}`);
  }
  if (uniqueUrls.length > 1) {
    extracted.project1 = uniqueUrls[1];
    notes.push(`🚀 Project 1: ${extracted.project1}`);
  }
  if (uniqueUrls.length > 2) {
    extracted.project2 = uniqueUrls[2];
    notes.push(`🚀 Project 2: ${extracted.project2}`);
  }
  if (uniqueUrls.length > 3) {
    extracted.project3 = uniqueUrls[3];
    notes.push(`🚀 Project 3: ${extracted.project3}`);
  }


  // ── Name ───────────────────────────────────────────────
  const nameSkip = [/@/, /\d{3}/, /http/i, /linkedin/i, /github/i, /^[+\d]/, /\|/, /[,;@#]/, /^[A-Z]{2,4}$/, /^\d/, /resume/i, /curriculum/i];
  for (const line of lines.slice(0, 10)) {
    if (line.length < 3 || line.length > 55) continue;
    if (nameSkip.some(p => p.test(line))) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z]/.test(w))) {
      extracted.firstName = words[0];
      extracted.lastName  = words.slice(1).join(' ');
      extracted.fullName  = line;
      notes.push(`👤 Name: ${line}`);
      break;
    }
  }

  // ── Location (City, State / City, Country) ─────────────
  const locM = text.match(/([A-Z][a-zÀ-ÿ]+(?: [A-Z][a-zÀ-ÿ]+)?),\s*([A-Z]{2}|[A-Z][a-zÀ-ÿ]+(?: [A-Z][a-zÀ-ÿ]+)?)/);
  if (locM) {
    extracted.city  = locM[1];
    extracted.state = locM[2];
    notes.push(`📍 Location: ${locM[1]}, ${locM[2]}`);
  }

  // ── Degree ─────────────────────────────────────────────
  const degreeM = text.match(
    /\b(Bachelor(?:'?s)?(?:\s+of\s+(?:Science|Arts|Engineering|Technology|Commerce))?|B\.\s?S\.?|B\.\s?E\.?|B\.\s?Tech\.?|B\.\s?A\.?|B\.\s?Com\.?|Master(?:'?s)?(?:\s+of\s+(?:Science|Arts|Business Administration|Engineering|Technology))?|M\.\s?S\.?|M\.\s?E\.?|M\.\s?Tech\.?|M\.\s?B\.\s?A\.?|M\.\s?A\.?|Ph\.\s?D\.?|Doctor(?:ate)?|Associate(?:'?s)?(?:\s+Degree)?|High\s+School\s+Diploma)\b/i
  );
  if (degreeM) {
    extracted.degree = degreeM[0].trim();
    notes.push(`🎓 Degree: ${degreeM[0].trim()}`);
  }

  // ── Field of Study ─────────────────────────────────────
  const FIELDS_OF_STUDY = [
    'Computer Science','Software Engineering','Information Technology','Information Systems',
    'Computer Engineering','Electrical Engineering','Electronics and Communication',
    'Mechanical Engineering','Civil Engineering','Chemical Engineering','Aerospace Engineering',
    'Data Science','Artificial Intelligence','Machine Learning','Statistics','Mathematics',
    'Physics','Chemistry','Biology','Biochemistry','Biotechnology',
    'Business Administration','Finance','Economics','Accounting','Marketing',
    'Psychology','Sociology','Communications','Journalism',
    'Graphic Design','UX Design','Product Design','Industrial Design',
    'Architecture','Environmental Science','Neuroscience',
  ];
  for (const f of FIELDS_OF_STUDY) {
    if (new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
      extracted.fieldOfStudy = f;
      notes.push(`📚 Major: ${f}`);
      break;
    }
  }

  // ── GPA / CGPA ─────────────────────────────────────────
  const gpaM = text.match(/(?:GPA|CGPA|G\.P\.A\.?)[\s:]*(\d[\d.]+)/i);
  if (gpaM) {
    extracted.gpa = gpaM[1];
    notes.push(`📊 GPA: ${gpaM[1]}`);
  }

  // ── Graduation Year ────────────────────────────────────
  const yearM = text.match(/(?:20\d{2}|19\d{2})\s*[-–—]\s*(?:20\d{2}|19\d{2}|Present|Current|Expected)/i);
  if (yearM) {
    const yrs = yearM[0].match(/\d{4}/g);
    if (yrs) {
      extracted.graduationYear = yrs[yrs.length - 1];
      notes.push(`📅 Grad Year: ${extracted.graduationYear}`);
    }
  }

  // ── Current Role ───────────────────────────────────────
  const rolePatterns = [
    /\b(?:Senior|Sr\.?|Junior|Jr\.?|Lead|Principal|Staff|Mid-?level|Entry-?level|Associate)?\s*(?:Software|Frontend|Front-?end|Backend|Back-?end|Full[\s-]?Stack|Fullstack|Mobile|iOS|Android|Web|Cloud|DevOps|Platform|Data|ML|AI|Machine Learning|Embedded|Systems?|QA|Test(?:ing)?|Security|Infrastructure|Site Reliability)\s*(?:Engineer|Developer|Architect|Scientist|Analyst|Specialist|Consultant)\b/i,
    /\b(?:Product|Project|Engineering|Technical|Technology|VP of|Director of|Head of)\s*(?:Manager|Director|Lead|VP|Officer|Principal)\b/i,
    /\b(?:UX|UI|UX\/UI|Product|Graphic|Visual|Motion|Brand|Web)\s*Designer\b/i,
    /\b(?:Data|Business|Systems?|Solutions?|Financial|Marketing)\s*Analyst\b/i,
    /\b(?:Technical|Content|Marketing)\s*Writer\b/i,
    /\bScrum Master\b/i,
    /\bCTO|CIO|CEO|COO|CFO\b/,
  ];
  for (const rp of rolePatterns) {
    const rm = text.match(rp);
    if (rm) {
      extracted.currentRole = rm[0].trim();
      notes.push(`💼 Role: ${rm[0].trim()}`);
      break;
    }
  }

  // ── Years of Experience ────────────────────────────────
  const expM = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp|professional)/i);
  if (expM) {
    extracted.yearsOfExperience = expM[1];
    notes.push(`⏱️ Experience: ${expM[1]} years`);
  }

  // ── Skills Extraction ──────────────────────────────────
  const foundSkills = TECH_SKILLS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow skill to appear at word boundaries or next to common separators
    return new RegExp(
      `(?:^|[\\s,/|•·◦▸▹➤►✔✓✗\\-])${escaped}(?:$|[\\s,/|•·◦▸▹➤►✔✓✗\\-.()])`,
      'im'
    ).test(text);
  });

  // De-duplicate case-insensitively and prefer shorter/nicer form
  const seenLower = new Set();
  const dedupedSkills = foundSkills.filter(s => {
    const key = s.toLowerCase();
    if (seenLower.has(key)) return false;
    seenLower.add(key);
    return true;
  });

  if (dedupedSkills.length > 0) {
    extracted.skills = dedupedSkills;
    const preview = dedupedSkills.slice(0, 6).join(', ');
    const more    = dedupedSkills.length > 6 ? ` +${dedupedSkills.length - 6} more` : '';
    notes.push(`🛠️ Skills: ${dedupedSkills.length} found — ${preview}${more}`);
  }

  return { extracted, notes };
}

// ── pdf.js worker path (loaded via manifest web_accessible_resources) ──
try {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdf.worker.min.js');
  }
} catch (_) {}

// ── Current uploaded file ──
let currentFile = null;          // File object
let currentFileText = null;      // Extracted plain text

// ============================================================
// FILE READING
// ============================================================

async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    return await extractTextFromPdf(file);
  } else {
    // .txt and anything else — read as text
    return await readFileAsText(file);
  }
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file, 'utf-8');
  });
}

async function extractTextFromPdf(file) {
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js not loaded — try pasting the text manually.');
  }

  const arrayBuffer    = await file.arrayBuffer();
  const pdf            = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts      = [];
  const annotationUrls = [];   // URLs collected from PDF hyperlinks

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Reconstruct readable lines from PDF text items
    let lastY   = null;
    let lineStr = '';
    const lines = [];

    content.items.forEach(item => {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        if (lineStr.trim()) lines.push(lineStr.trim());
        lineStr = '';
      }
      lineStr += item.str + ' ';
      lastY = item.transform[5];
    });
    if (lineStr.trim()) lines.push(lineStr.trim());
    pageTexts.push(lines.join('\n'));

    // Also collect URLs from PDF annotation (hyperlink) layer.
    // LinkedIn, GitHub, portfolio URLs are almost always stored as
    // clickable hyperlinks inside the PDF — not as visible plain text.
    // getAnnotations() exposes those actual destination URLs.
    try {
      const annotations = await page.getAnnotations();
      annotations.forEach(ann => {
        const url = ann.url || (ann.action && ann.action.URI) || '';
        if (url && /^https?:\/\//i.test(url)) {
          annotationUrls.push(url.trim());
        }
      });
    } catch (_) { /* non-critical */ }
  }

  // Append de-duplicated hyperlinks to the extracted text blob so
  // parseResume() regexes can match them alongside visible text.
  if (annotationUrls.length > 0) {
    const unique = [...new Set(annotationUrls)];
    pageTexts.push('\n\n--- PDF hyperlinks ---\n' + unique.join('\n'));
  }

  return pageTexts.join('\n\n');
}


// ============================================================
// FILE UPLOAD ZONE
// ============================================================

function initFileUpload() {
  const zone      = document.getElementById('uploadZone');
  const fileInput = document.getElementById('resumeFileInput');
  const clearBtn  = document.getElementById('fileClearBtn');
  const parseBtn  = document.getElementById('parseResumeBtn');

  // ── Click anywhere on idle zone to open file picker ──
  zone.addEventListener('click', e => {
    if (currentFile) return;          // already has a file, don't re-open
    if (e.target === clearBtn) return;
    fileInput.click();
  });

  // ── Native file input change ──
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
    fileInput.value = '';             // reset so same file can be re-selected
  });

  // ── Drag & Drop ──
  zone.addEventListener('dragenter', e => { e.preventDefault(); });
  zone.addEventListener('dragover',  e => {
    e.preventDefault();
    if (!currentFile) zone.classList.add('jf-drag-over');
  });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('jf-drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('jf-drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) setFile(file);
  });

  // ── Textarea change — enable button if text is present ──
  const textarea = document.getElementById('resumeText');
  textarea?.addEventListener('input', () => {
    if (!currentFile && textarea.value.trim()) {
      parseBtn.disabled = false;
      document.getElementById('parseBtnIcon').textContent = '🔍';
      document.getElementById('parseBtnText').textContent = 'Parse Text & Extract Data';
    } else if (!currentFile) {
      parseBtn.disabled = true;
      document.getElementById('parseBtnIcon').textContent = '📄';
      document.getElementById('parseBtnText').textContent = 'Upload a resume to begin';
    }
  });

  // ── Clear file ──
  clearBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearFile();
  });
}

function setFile(file) {
  const allowed = ['pdf', 'txt', 'text'];
  const ext     = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showParseResult('err', '⚠️ Unsupported file type. Please upload a PDF or TXT file.');
    return;
  }

  currentFile     = file;
  currentFileText = null;

  const zone = document.getElementById('uploadZone');
  zone.classList.add('jf-has-file');

  document.getElementById('fileTypeIcon').textContent = ext === 'pdf' ? '📄' : '📝';
  document.getElementById('fileName').textContent     = file.name;
  document.getElementById('fileSize').textContent     = formatBytes(file.size);

  const parseBtn = document.getElementById('parseResumeBtn');
  parseBtn.disabled = false;
  document.getElementById('parseBtnIcon').textContent = '🔍';
  document.getElementById('parseBtnText').textContent = 'Parse Resume & Extract Data';

  // Clear previous result
  const res = document.getElementById('parseResult');
  res.style.display = 'none';
}

function clearFile() {
  currentFile     = null;
  currentFileText = null;

  const zone = document.getElementById('uploadZone');
  zone.classList.remove('jf-has-file');

  const parseBtn = document.getElementById('parseResumeBtn');
  parseBtn.disabled = true;
  document.getElementById('parseBtnIcon').textContent = '📄';
  document.getElementById('parseBtnText').textContent = 'Upload a resume to begin';

  const res = document.getElementById('parseResult');
  res.style.display = 'none';
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// RESUME PARSER UI
// ============================================================

function initResumeParser() {
  initFileUpload();

  document.getElementById('parseResumeBtn').addEventListener('click', async () => {
    const btn = document.getElementById('parseResumeBtn');

    // Determine source: uploaded file first, textarea fallback
    let rawText = '';
    if (currentFile) {
      btn.disabled = true;
      document.getElementById('parseBtnIcon').innerHTML = '<span class="jf-spin">⏳</span>';
      document.getElementById('parseBtnText').textContent =
        currentFile.name.toLowerCase().endsWith('.pdf')
          ? 'Extracting text from PDF…'
          : 'Reading file…';

      try {
        rawText = currentFileText || await extractTextFromFile(currentFile);
        currentFileText = rawText;   // cache so re-parse is instant
      } catch (err) {
        btn.disabled = false;
        document.getElementById('parseBtnIcon').textContent = '⚠️';
        document.getElementById('parseBtnText').textContent = 'Failed to read file';
        showParseResult('err', `⚠️ ${err.message}`);
        setTimeout(() => {
          document.getElementById('parseBtnIcon').textContent = '🔍';
          document.getElementById('parseBtnText').textContent = 'Parse Resume & Extract Data';
          btn.disabled = false;
        }, 3000);
        return;
      }
    } else {
      // Fallback: textarea
      rawText = document.getElementById('resumeText')?.value || '';
    }

    if (!rawText.trim()) {
      showParseResult('err', '⚠️ No content to parse. Upload a file or paste text manually.');
      return;
    }

    // Parsing state
    btn.disabled = true;
    document.getElementById('parseBtnIcon').innerHTML = '<span class="jf-spin">⏳</span>';
    document.getElementById('parseBtnText').textContent = 'Parsing…';

    await new Promise(r => setTimeout(r, 400));

    const { extracted, notes } = parseResume(rawText);

    let appliedCount = 0;
    for (const [key, value] of Object.entries(extracted)) {
      if (key === 'skills') {
        const newOnes = value.filter(s => !skills.some(cs => cs.toLowerCase() === s.toLowerCase()));
        skills.push(...newOnes);
        renderTags();
        syncChips();
        appliedCount++;
      } else {
        const el = document.getElementById(key);
        if (el && value) {
          el.value = String(value).trim();
          el.style.transition = 'border-color 0.3s ease';
          el.style.borderColor = '#10b981';
          setTimeout(() => { el.style.borderColor = ''; }, 3000);
          appliedCount++;
        }
      }
    }

    // Reset button
    btn.disabled = false;
    document.getElementById('parseBtnIcon').textContent = appliedCount > 0 ? '✅' : '⚠️';
    document.getElementById('parseBtnText').textContent = appliedCount > 0
      ? `Extracted ${appliedCount} fields!`
      : 'Could not extract much — try a different file';

    setTimeout(() => {
      document.getElementById('parseBtnIcon').textContent = '🔍';
      document.getElementById('parseBtnText').textContent = 'Parse Resume & Extract Data';
    }, 4000);

    if (notes.length > 0 && appliedCount > 0) {
      showParseResult('ok', `<strong>✨ Extracted ${appliedCount} fields:</strong><br>${notes.join('<br>')}`);
      document.querySelector('[data-tab="personal"]')?.click();
    } else {
      showParseResult('err', "⚠️ Couldn't find much. Try a cleaner PDF or the TXT version of your resume.");
    }
  });
}


function showParseResult(type, html) {
  const el = document.getElementById('parseResult');
  el.className = `jf-parse-result ${type}`;
  el.innerHTML = html;
  el.style.display = 'block';
}

// ── Fill Current Tab ──────────────────────────────────────

async function fillCurrentTab() {
  await saveProfile();

  const btn = document.getElementById('fillNowBtn');
  btn.textContent = '⏳ Filling…';
  btn.disabled    = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Try messaging the already-injected content script first
    let filled = 0;
    try {
      const res = await chrome.tabs.sendMessage(tab.id, {
        type:    'FILL_FORMS',
        profile: profile,
      });
      filled = res?.filled ?? 0;
    } catch (_) {
      // Content script not yet loaded (e.g. extension just installed) — inject & retry
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] });
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/content.css'] });
      await new Promise(r => setTimeout(r, 200));
      const res2 = await chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORMS', profile });
      filled = res2?.filled ?? 0;
    }

    btn.textContent = `✅ ${filled} field${filled !== 1 ? 's' : ''} filled!`;
    btn.disabled    = false;
    setTimeout(() => {
      btn.textContent = '⚡ Fill Now';
    }, 4000);

  } catch (err) {
    console.error('[JobFill] fill error', err);
    btn.textContent = '⚠️ Error — reload page & retry';
    btn.disabled    = false;
    setTimeout(() => { btn.textContent = '⚡ Fill Now'; }, 4000);
  }
}
