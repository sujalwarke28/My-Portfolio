/**
 * ============================================================================
 *  THE CV, AS DATA.
 * ============================================================================
 *
 *  This is a transcription of CV_EU_SujalWarke_2pages.pdf, kept as structured
 *  data so the plain page can render it as real HTML — selectable, searchable,
 *  screen-reader friendly and printable — instead of embedding a PDF viewer.
 *
 *  The downloadable file lives at public/cv/Sujal-Warke-CV.pdf. If you update
 *  the PDF, update this file in the same commit so the page and the download
 *  never disagree.
 *
 *  Deliberately omitted from this page: the street address printed on the PDF.
 *  A public web page does not need a home address for a recruiter to reach you.
 */

export interface CvRole {
  when: string;
  location?: string;
  title: string;
  org?: string;
  body?: string;
  /** Rendered as a labelled run of chips under the entry. */
  skills?: string[];
  link?: { label: string; href: string };
}

export interface CvSkillGroup {
  label: string;
  items: string[];
}

export interface CvLanguage {
  name: string;
  listening: string;
  reading: string;
  spokenProduction: string;
  spokenInteraction: string;
  writing: string;
}

export interface CvContent {
  name: string;
  headline: string;
  /** Short identity facts shown as a run under the name. */
  facts: string[];
  contact: { label: string; value: string; href?: string }[];
  download: { href: string; filename: string; note: string };
  about: string;
  education: CvRole[];
  experience: CvRole[];
  skills: CvSkillGroup[];
  languages: {
    motherTongue: string;
    rows: CvLanguage[];
    scale: string;
  };
  honours: CvRole[];
  projects: CvRole[];
  certifications: CvRole[];
}

export const cv: CvContent = {
  name: 'Sujal Warke',
  headline: 'Full Stack Developer · B.Tech Computer Science and Engineering',
  facts: ['Born 28/11/2006', 'Mumbai, India', 'Indian nationality'],

  contact: [
    { label: 'Email', value: 'warke.sujal281106@gmail.com', href: 'mailto:warke.sujal281106@gmail.com' },
    { label: 'Phone', value: '+91 81696 13561', href: 'tel:+918169613561' },
    { label: 'LinkedIn', value: 'linkedin.com/in/sujalwarke', href: 'https://linkedin.com/in/sujalwarke' },
    { label: 'GitHub', value: 'github.com/sujalwarke28', href: 'https://github.com/sujalwarke28' },
    { label: 'Based in', value: 'Thane, Mumbai, Maharashtra, India' },
  ],

  download: {
    href: '/cv/Sujal-Warke-CV.pdf',
    filename: 'Sujal-Warke-CV.pdf',
    note: 'Two pages · PDF · Europass format',
  },

  about:
    'Third-year B.Tech Computer Science and Engineering student at ITM Skills University, interested in Artificial Intelligence, Machine Learning, and emerging technologies. Project experience spans computer vision, predictive maintenance, IoT, and full-stack development, with a growing focus on the intersection of machine learning, finance, and research.',

  education: [
    {
      when: '01/08/2024 – Current',
      location: 'Mumbai, India',
      title: 'Bachelor of Technology in Computer Science and Engineering',
      org: 'ITM Skills University, Navi Mumbai, Maharashtra, India',
      body:
        'Core coursework in Programming and Software Development, Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Networks, Software Engineering, Machine Learning, Artificial Intelligence, Mathematics for Computing, and Cloud Computing. Practical work covers Python, Java, and C++ programming, web development, database design, machine learning model development, and algorithmic problem-solving.',
      skills: ['EQF level 6'],
    },
  ],

  experience: [
    {
      when: '07/04/2026 – Current',
      location: 'Thane, Mumbai, India',
      title: 'Full Stack Developer Intern',
      org: 'Manstruct Technologies Pvt Ltd',
      body:
        'Building end-to-end web applications: responsive frontend interfaces, scalable server-side systems, RESTful API design and integration, database management, authentication and authorisation, application testing, debugging, and deployment.',
      skills: [
        'Full-stack web development',
        'RESTful API design',
        'Responsive UI/UX',
        'Authentication & authorisation',
        'Software architecture',
        'Testing & deployment',
      ],
    },
    {
      when: '01/01/2026 – 06/04/2026',
      location: 'Vashi, Navi Mumbai, India',
      title: 'Operations Intern',
      org: 'LetsUpgrade',
      body:
        'Automated repetitive operational processes, coordinated technical and content teams, managed project workflows, and improved curriculum-generation pipelines for large-scale user delivery. Responsibilities spanned process optimisation, project coordination, stakeholder management, and team leadership.',
      skills: [
        'Workflow automation (n8n)',
        'Curriculum generation pipelines',
        'Process optimisation',
        'Microsoft Excel',
        'Notion',
        'Google Gemini, ChatGPT',
      ],
    },
  ],

  skills: [
    {
      label: 'Programming',
      items: ['Python', 'C++', 'Java', 'JavaScript', 'TypeScript'],
    },
    {
      label: 'Machine Learning & AI',
      items: [
        'Supervised and unsupervised learning',
        'Predictive modelling',
        'Retrieval-Augmented Generation (RAG)',
        'Large Language Models (LLMs)',
        'NumPy, Pandas, scikit-learn, TensorFlow, NLTK, Matplotlib',
        'Data extraction, preprocessing, cleaning, and visualisation',
      ],
    },
    {
      label: 'Web & Databases',
      items: [
        'MERN stack (MongoDB, Express.js, React.js, Node.js)',
        'RESTful APIs',
        'MySQL',
        'MongoDB',
      ],
    },
    {
      label: 'Tools',
      items: ['Git/GitHub', 'GitLab', 'Docker', 'Microsoft Excel, Word, PowerPoint'],
    },
    {
      label: 'Soft skills',
      items: [
        'Leadership and group project management',
        'Team collaboration and support',
        'Problem finding, shaping, and solving',
        'Critical and analytical thinking',
        'Adaptability',
        'Attention to detail',
        'Conflict management',
        'Integrity and accountability',
      ],
    },
    {
      label: 'Organisational',
      items: [
        'Project management',
        'Time management and task prioritisation',
        'Resource management',
        'Multitasking under pressure',
        'Goal setting and meeting deadlines',
      ],
    },
  ],

  languages: {
    motherTongue: 'Marathi',
    rows: [
      {
        name: 'English',
        listening: 'C2',
        reading: 'C2',
        spokenProduction: 'C2',
        spokenInteraction: 'C2',
        writing: 'C2',
      },
      {
        name: 'Hindi',
        listening: 'C2',
        reading: 'C2',
        spokenProduction: 'C2',
        spokenInteraction: 'C2',
        writing: 'C2',
      },
      {
        name: 'Sanskrit',
        listening: 'A1',
        reading: 'B1',
        spokenProduction: 'C2',
        spokenInteraction: 'A1',
        writing: 'A2',
      },
    ],
    scale:
      'A1 and A2 — Basic user · B1 and B2 — Independent user · C1 and C2 — Proficient user',
  },

  honours: [
    {
      when: '07/06/2024',
      title: 'Maharashtra State Topper in Electrical Maintenance 2024',
      org: 'Maharashtra State Board of Secondary and Higher Secondary Education',
      body:
        'Achieved the highest academic performance in Electrical Maintenance at state level during Class XII, demonstrating strong technical knowledge of electrical systems and maintenance principles.',
      skills: [
        'Electrical systems fundamentals',
        'Circuit analysis and development',
        'Equipment maintenance',
        'Electrical troubleshooting',
        'Practical problem-solving',
      ],
    },
  ],

  projects: [
    {
      when: '01/07/2026 – 07/08/2026',
      title: 'TitanMinds: Factory Automation and Predictive Maintenance System',
      body:
        'IoT-based predictive maintenance solution for industrial machinery that anticipates equipment failures using temperature, sound, and vibration data. The system analyses machine parameters to identify abnormal operating patterns and provide early warnings to factory engineers, and integrates Digital Twin technology for virtual representation and monitoring of physical machinery.',
      skills: [
        'IoT',
        'Machine Learning',
        'Predictive Maintenance',
        'Digital Twin Technology',
        'Sensor Data Analysis',
        'Anomaly Detection',
      ],
    },
    {
      when: '25/09/2026 – 01/10/2026',
      title: 'Signals: Learn Sign Language',
      body:
        'A Flutter application for learning sign language, featuring a public landing page, video lessons, quizzes, live-calculated progress tracking, and a community laid out like a chat client. An admin role can publish new lessons and quiz questions at any time without an app rebuild.',
      skills: [
        'Flutter',
        'Dart',
        'Cross-platform & Android development',
        'Riverpod',
        'Firebase Authentication',
        'Cloud Firestore',
        'Cloudinary',
        'NoSQL database design',
        'Role-Based Access Control (RBAC)',
        'Firestore security rules',
        'Material Design 3',
        'Unit testing',
      ],
      link: {
        label: 'github.com/sujalwarke28/Signals-Learn-Sign-Language',
        href: 'https://github.com/sujalwarke28/Signals-Learn-Sign-Language',
      },
    },
    {
      when: '19/04/2025 – 01/05/2025',
      title: 'Traffic Violation Detection System',
      body:
        'AI-powered traffic violation detection system using computer vision and image processing to identify violations from visual data. Integrated YOLO and OpenCV for vehicle detection and TensorFlow.js for violation detection, with Tesseract.js for automated number plate recognition and character extraction. Achieved 91% accuracy in violation detection and 98% accuracy in number plate recognition.',
      skills: [
        'Computer Vision',
        'Image Processing',
        'YOLO',
        'OpenCV',
        'Deep Learning',
        'Object Detection',
        'OCR (Tesseract.js)',
        'TensorFlow.js',
      ],
      link: {
        label: 'github.com/sujalwarke28/traffic-violation-detection-system',
        href: 'https://github.com/sujalwarke28/traffic-violation-detection-system',
      },
    },
  ],

  certifications: [
    {
      when: '10/09/2026',
      location: 'Online',
      title: 'Basics of Quantum Information',
      org: 'IBM',
      body:
        'Introductory course on quantum computing covering qubits, superposition, entanglement, quantum gates, quantum circuits, and the fundamental differences between classical and quantum computing.',
      link: {
        label: 'View credential on Credly',
        href: 'https://www.credly.com/badges/295e5f4b-827d-4a5b-8bb6-1020504658e0/public_url',
      },
    },
  ],
};

export default cv;
