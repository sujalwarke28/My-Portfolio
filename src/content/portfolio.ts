/**
 * ============================================================================
 *  THE ONLY FILE YOU NEED TO EDIT.
 * ============================================================================
 *
 *  Everything the visitor reads lives here. The game engine, the maps and the
 *  UI panels all read from this file, so you never have to touch game code to
 *  change your content.
 *
 *  Anything written in SHOUTING CAPS is a placeholder — replace it.
 *  Your photo goes at:  public/photo/me.jpg
 *
 *  Tip: `skills[].level` is 0-100 and drives the length of the stat bars, so
 *  keep them honest — a wall of 95s reads as noise, a varied spread reads as
 *  a real person.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Skill {
  name: string;
  /** 0-100. Drives the stat bar length. */
  level: number;
  /** Optional one-liner shown when the skill is selected. */
  note?: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  /** A single emoji or character used as the group's badge. */
  icon: string;
  blurb: string;
  skills: Skill[];
}

export interface StoryChapter {
  id: string;
  title: string;
  kind: 'professional' | 'personal';
  /** Shown as the chapter's timeline marker, e.g. "2024" or "Always". */
  when: string;
  /** Each string is one paragraph. */
  body: string[];
}

export interface Project {
  id: string;
  title: string;
  blurb: string;
  tech: string[];
  github?: string;
  live?: string;
  /** One sentence on the hardest or most interesting part. */
  highlight?: string;
  /** Marks the project as the headline entry in the list. */
  featured?: boolean;
}

export interface ContactEntry {
  id: string;
  label: string;
  value: string;
  /** Where clicking goes. Omit for things that are not links. */
  href?: string;
  /** Shows a "copy" button next to the value. */
  copyable?: boolean;
  icon: string;
}

export interface PortfolioContent {
  trainer: {
    name: string;
    handle: string;
    title: string;
    tagline: string;
    location: string;
  };
  photo: {
    /** Path relative to /public. Put your photo at public/photo/me.jpg. */
    src: string;
    alt: string;
    caption: string;
    /** Shown under the caption, in smaller text. */
    footnote: string;
  };
  skillGroups: SkillGroup[];
  story: StoryChapter[];
  projects: Project[];
  contact: ContactEntry[];
  /** Flavour text for the signposts and NPCs scattered around the town. */
  flavour: {
    welcomeSign: string[];
    guideNpc: string[];
    secretFind: string[];
  };
}

// ---------------------------------------------------------------------------
// Your content
// ---------------------------------------------------------------------------

export const content: PortfolioContent = {
  trainer: {
    name: 'Sujal Warke',
    handle: 'sujalwarke28',
    title: 'Full Stack Developer',
    tagline: 'Full-stack by trade, machine learning by obsession. I ship things, then measure them.',
    location: 'Mumbai, Maharashtra, India',
  },

  photo: {
    src: '/photo/me.jpg',
    alt: 'Photograph of Sujal Warke in a blue suit',
    caption: 'Sujal Warke',
    footnote: 'Third-year CSE at ITM Skills University — open to work',
  },

  skillGroups: [
    {
      id: 'languages',
      name: 'Languages',
      icon: '◆',
      blurb: 'Python when the problem is data, TypeScript when the problem is a product, C++ when it has to be fast.',
      skills: [
        {
          name: 'Python',
          level: 80,
          note: 'My default for anything with data in it — NumPy, Pandas, scikit-learn, TensorFlow, NLTK. Both of my research projects live here.',
        },
        {
          name: 'JavaScript',
          level: 85,
          note: 'The language I have written the most of. MERN apps at my internship, plus TensorFlow.js and Tesseract.js in the traffic violation detector.',
        },
        {
          name: 'TypeScript',
          level: 70,
          note: 'What I reach for once a project is past the prototype stage — this site is TypeScript end to end.',
        },
        {
          name: 'Java',
          level: 75,
          note: 'Where I learned object-oriented design properly: coursework in OOP, data structures and algorithms.',
        },
        {
          name: 'C++',
          level: 70,
          note: 'Algorithmic problem-solving and the places where a tight loop actually matters.',
        },
      ],
    },
    {
      id: 'frontend',
      name: 'Frontend',
      icon: '▲',
      blurb: 'An interface earns its keep when a first-time visitor never has to ask what to do next.',
      skills: [
        {
          name: 'React',
          level: 85,
          note: 'Responsive product interfaces at Manstruct Technologies, and the panel system in this portfolio.',
        },
        {
          name: 'CSS',
          level: 90,
          note: 'Layout, responsive behaviour and getting a design to hold up at phone width. Tailwind most days.',
        },
        {
          name: 'HTML',
          level: 95,
          note: 'Semantics first — it is why this site still reads correctly with JavaScript turned off.',
        },
        {
          name: 'Flutter',
          level: 70,
          note: 'Built Signals, a cross-platform sign-language learning app, with Riverpod for state and Material Design 3 for the surface.',
        },
      ],
    },
    {
      id: 'backend',
      name: 'Backend & Data',
      icon: '■',
      blurb: 'A backend is a contract. I would rather spend the extra hour on the schema than a week on the workaround.',
      skills: [
        {
          name: 'Node.js',
          level: 80,
          note: 'Server-side work across my internship projects: routing, auth, integration with third-party APIs.',
        },
        {
          name: 'REST API design',
          level: 80,
          note: 'Designing and integrating endpoints that the frontend can consume without a translation layer.',
        },
        {
          name: 'Express.js',
          level: 75,
          note: 'The M, E and N of most things I have shipped — middleware, authentication and authorisation flows.',
        },
        {
          name: 'MongoDB',
          level: 75,
          note: 'NoSQL schema design, including Firestore modelling and security rules for the Signals app.',
        },
        {
          name: 'FastAPI',
          level: 75,
          note: 'How I put a Python model behind an endpoint when the inference needs to leave the notebook.',
        },
        {
          name: 'MySQL',
          level: 70,
          note: 'Relational design and queries from DBMS coursework and project work.',
        },
      ],
    },
    {
      id: 'ml',
      name: 'AI & ML',
      icon: '★',
      blurb: 'A number on its own is a claim. I care more about why a model is confident than how confident it says it is.',
      skills: [
        {
          name: 'Machine Learning',
          level: 75,
          note: 'Supervised and unsupervised learning, predictive modelling, and the unglamorous part — extraction, cleaning and preprocessing.',
        },
        {
          name: 'Computer Vision',
          level: 75,
          note: 'YOLO and OpenCV for vehicle detection, Tesseract.js for plate OCR: 91% accuracy on violations, 98% on number plates.',
        },
        {
          name: 'Explainable AI',
          level: 70,
          note: 'SHAP to read which fiscal indicators a model is actually leaning on, across roughly 150 countries of IMF and World Bank data.',
        },
        {
          name: 'LLMs & RAG',
          level: 70,
          note: 'Retrieval-augmented generation, and probing BERT and FinBERT for whether a paraphrase changes their verdict.',
        },
        {
          name: 'TensorFlow',
          level: 65,
          note: 'Model development for classification work, including the browser-side violation classifier.',
        },
      ],
    },
    {
      id: 'craft',
      name: 'Craft',
      icon: '◈',
      blurb: 'The skills that decide whether the technical work ever reaches anybody.',
      skills: [
        {
          name: 'Problem shaping',
          level: 85,
          note: 'Finding and framing the problem before solving it — usually the step that saves the most time.',
        },
        {
          name: 'Workflow automation',
          level: 80,
          note: 'Four months at LetsUpgrade automating operational processes with n8n and rebuilding the curriculum-generation pipeline for large-scale delivery.',
        },
        {
          name: 'Team leadership',
          level: 80,
          note: 'Coordinating technical and content teams against one deadline, and being the person the schedule survives.',
        },
        {
          name: 'Git & Docker',
          level: 75,
          note: 'Git and GitHub daily, GitLab and Docker where the project calls for it.',
        },
        {
          name: 'Technical writing',
          level: 75,
          note: 'Documentation and research write-ups. If I cannot explain the system in a page, I do not understand it yet.',
        },
      ],
    },
  ],

  story: [
    {
      id: 'start',
      title: 'Where It Started',
      kind: 'professional',
      when: '2024',
      body: [
        'Before I wrote code I was wiring circuits. I took Electrical Maintenance seriously enough in Class XII to finish as Maharashtra State Topper in 2024 — mostly because a circuit either works or it does not, and that is an honest kind of feedback.',
        'Software turned out to be the same loop with shorter wires. The first thing I built that genuinely worked was a traffic violation detector that read number plates off real footage, and watching it pull a plate correctly from a blurry frame is the moment this stopped being coursework.',
      ],
    },
    {
      id: 'now',
      title: 'What I Do Now',
      kind: 'professional',
      when: 'Today',
      body: [
        'I am a third-year B.Tech Computer Science and Engineering student at ITM Skills University in Navi Mumbai, and a full-stack developer intern at Manstruct Technologies in Thane. Day to day that means React and Node, REST APIs, authentication, database design, and getting things deployed rather than demoed.',
        'The other half of my week is machine learning research. One project tests whether BERT and FinBERT hold the same verdict when a corporate disclosure is paraphrased; the other predicts fiscal stress across roughly 150 countries using Logistic Regression, Random Forest and XGBoost over IMF and World Bank data.',
      ],
    },
    {
      id: 'next',
      title: 'What I Am Chasing',
      kind: 'professional',
      when: 'Next',
      body: [
        'I want to keep working where machine learning meets finance — models whose output someone would stake a real decision on, with the explainability built in rather than bolted on afterwards. A SHAP plot only matters when it changes what you ship.',
        'I am open to work: full-stack and ML engineering roles or internships. I do my best work on small teams where I can own something end to end and get told plainly when I am wrong.',
      ],
    },
    {
      id: 'offscreen',
      title: 'Away From The Keyboard',
      kind: 'personal',
      when: 'Weekends',
      body: [
        'Football. I play with people whose styles have nothing in common with mine, which is most of the appeal — you get about a second to read where everybody is going and then commit to it. It keeps me fit and it keeps me decisive.',
      ],
    },
    {
      id: 'wiring',
      title: 'How I Am Wired',
      kind: 'personal',
      when: 'Always',
      body: [
        'Chess gave me the habit I rely on most: sit still, look a few moves out, pick a line instead of reacting to the last thing that happened. It carries straight into work — I would rather spend ten minutes finding where a bug actually lives than an hour guessing at it.',
        'The thing people notice first is that I take the coordinating work seriously. Automating someone else out of a repetitive task, or keeping two teams pointed at the same deadline, is not a detour from the engineering to me.',
      ],
    },
    {
      id: 'fuel',
      title: 'Small Things I Like',
      kind: 'personal',
      when: 'Daily',
      body: [
        'Chess puzzles in dead time, a match on in the background, and reading documentation for things I have no immediate use for — I took IBM’s quantum information course purely because I wanted to know what a qubit actually does.',
        'Marathi at home, Hindi and English everywhere else, and enough Sanskrit to be unreasonably pleased when I can read a line of it. Also: any automation that quietly deletes a task I used to do by hand.',
      ],
    },
  ],

  projects: [
    {
      id: 'titanminds',
      title: 'TitanMinds — Predictive Maintenance',
      blurb:
        'An IoT system that warns factory engineers before a machine fails, reading live temperature, sound and vibration data off industrial equipment. Built for plant floors where unplanned downtime is the expensive problem.',
      tech: ['IoT', 'Machine Learning', 'Anomaly Detection', 'Digital Twin', 'Python'],
      highlight:
        '"Normal" is not one setting on a factory floor, so fixed thresholds were useless — the system learns each machine’s own operating pattern and flags deviation from that, with a Digital Twin mirroring the physical machine so an engineer can see an abnormal reading in context.',
      featured: true,
    },
    {
      id: 'signals',
      title: 'Signals — Learn Sign Language',
      blurb:
        'A Flutter app for learning sign language, with video lessons, quizzes, live-calculated progress and a community laid out like a chat client. Built so a learner never hits a dead end between lessons.',
      tech: ['Flutter', 'Dart', 'Riverpod', 'Firebase', 'Cloud Firestore'],
      github: 'https://github.com/sujalwarke28/Signals-Learn-Sign-Language',
      highlight:
        'New content had to reach users without shipping a new build, so lessons and quiz questions live in Firestore behind role-based access control and security rules — an admin publishes a lesson and every installed app has it seconds later.',
    },
    {
      id: 'traffic-violation',
      title: 'Traffic Violation Detection',
      blurb:
        'A computer vision system that spots traffic violations in footage and reads the number plate of the vehicle involved. Aimed at the manual review work that makes enforcement slow.',
      tech: ['YOLO', 'OpenCV', 'TensorFlow.js', 'Tesseract.js', 'Computer Vision'],
      github: 'https://github.com/sujalwarke28/traffic-violation-detection-system',
      highlight:
        'Detection and recognition are different problems, so they got different tools: YOLO and OpenCV find the vehicle, TensorFlow.js classifies the violation, Tesseract.js extracts the plate — 91% accuracy on violations and 98% on plate recognition.',
    },
    {
      id: 'fiscal-ml',
      title: 'Fiscal Stress Prediction (Research)',
      blurb:
        'An ongoing cross-country study predicting fiscal stress from IMF and World Bank indicators, with Singapore and India as the focal comparison. The real question is which indicators carry the warning signal.',
      tech: ['Python', 'scikit-learn', 'XGBoost', 'SHAP', 'Pandas'],
      highlight:
        'Logistic Regression, Random Forest and XGBoost across roughly 150 countries and 20-25 years, with SHAP used to read what each model is leaning on instead of trusting the accuracy number on its own.',
    },
    {
      id: 'finbert-robustness',
      title: 'Does FinBERT Survive A Paraphrase? (Research)',
      blurb:
        'Research into whether transformer models flag the same financial risk when a corporate disclosure is reworded but means exactly the same thing. If a paraphrase changes the verdict, the model is not reading risk.',
      tech: ['BERT', 'FinBERT', 'NLP', 'Transformers', 'Python'],
      highlight:
        'Built semantically equivalent variations of real disclosures — paraphrases, reordered clauses, altered wording — and measured how far the predictions drift, to locate the point where financial NLP stops being trustworthy.',
    },
    {
      id: 'portfolio-quest',
      title: 'Portfolio Quest (this site)',
      blurb:
        'The site you are standing in: a GBA-style town you walk around instead of a page you scroll. Each building holds one section of an otherwise ordinary portfolio.',
      tech: ['TypeScript', 'React', 'Canvas', 'Vite'],
      github: 'https://github.com/sujalwarke28',
      highlight:
        'A game loop and a document want opposite things, so the canvas owns movement while every panel is real DOM — anyone on a keyboard, a screen reader, or with JavaScript switched off still gets the whole portfolio as plain text.',
    },
  ],

  contact: [
    {
      id: 'email',
      label: 'Email',
      value: 'warke.sujal281106@gmail.com',
      href: 'mailto:warke.sujal281106@gmail.com',
      copyable: true,
      icon: '✉',
    },
    {
      id: 'phone',
      label: 'Phone',
      value: '+91 81696 13561',
      href: 'tel:+918169613561',
      copyable: true,
      icon: '☎',
    },
    {
      id: 'github',
      label: 'GitHub',
      value: 'github.com/sujalwarke28',
      href: 'https://github.com/sujalwarke28',
      icon: '⌨',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: 'linkedin.com/in/sujalwarke',
      href: 'https://linkedin.com/in/sujalwarke',
      icon: '◈',
    },
    {
      id: 'credly',
      label: 'Certification',
      value: 'IBM — Basics of Quantum Information',
      href: 'https://www.credly.com/badges/295e5f4b-827d-4a5b-8bb6-1020504658e0/public_url',
      icon: '◉',
    },
    {
      id: 'location',
      label: 'Based in',
      value: 'Mumbai, India (IST)',
      icon: '⌖',
    },
  ],

  flavour: {
    welcomeSign: [
      'WELCOME TO PORTFOLIO TOWN!',
      'Five buildings. Everything worth knowing about me is inside one of them.',
    ],
    guideNpc: [
      'Oh, you made it out of the house!',
      'Use WASD or the arrow keys to walk. Press E when you are facing something interesting.',
      'Press M for the map if you get turned around. Have a good look round!',
    ],
    secretFind: [
      'You found the quiet spot behind the trees.',
      'Not much here. But you looked, and that tells me something about you.',
    ],
  },
};

export default content;
