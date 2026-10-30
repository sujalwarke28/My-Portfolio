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
    name: 'YOUR NAME HERE',
    handle: 'YOUR_GITHUB_HANDLE',
    title: 'YOUR ROLE HERE, e.g. Full-Stack Developer',
    tagline: 'A ONE-LINE TAGLINE ABOUT YOU',
    location: 'YOUR CITY, COUNTRY',
  },

  photo: {
    src: '/photo/me.jpg',
    alt: 'Photograph of YOUR NAME HERE',
    caption: 'YOUR NAME HERE',
    footnote: 'REPLACE public/photo/me.jpg WITH YOUR OWN PHOTO',
  },

  skillGroups: [
    {
      id: 'languages',
      name: 'Languages',
      icon: '◆',
      blurb: 'REPLACE THIS — a line about how you pick a language for a job.',
      skills: [
        { name: 'TypeScript', level: 90, note: 'REPLACE — what you have built with it.' },
        { name: 'Python', level: 80, note: 'REPLACE — where you reach for it.' },
        { name: 'Java', level: 65, note: 'REPLACE — context you used it in.' },
        { name: 'SQL', level: 75, note: 'REPLACE — the gnarliest query you have written.' },
      ],
    },
    {
      id: 'frontend',
      name: 'Frontend',
      icon: '▲',
      blurb: 'REPLACE THIS — a line about how you think about interfaces.',
      skills: [
        { name: 'React', level: 90, note: 'REPLACE — your strongest React work.' },
        { name: 'Next.js', level: 80, note: 'REPLACE — what you shipped with it.' },
        { name: 'CSS / Tailwind', level: 85, note: 'REPLACE — your take on styling.' },
        { name: 'Canvas / WebGL', level: 60, note: 'REPLACE — this portfolio counts!' },
      ],
    },
    {
      id: 'backend',
      name: 'Backend',
      icon: '■',
      blurb: 'REPLACE THIS — a line about what you value in a backend.',
      skills: [
        { name: 'Node.js', level: 85, note: 'REPLACE — services you have run.' },
        { name: 'PostgreSQL', level: 75, note: 'REPLACE — schema you are proud of.' },
        { name: 'REST / GraphQL', level: 80, note: 'REPLACE — API design opinions.' },
        { name: 'Docker', level: 70, note: 'REPLACE — how you deploy.' },
      ],
    },
    {
      id: 'craft',
      name: 'Craft',
      icon: '★',
      blurb: 'REPLACE THIS — the non-code skills that make you good to work with.',
      skills: [
        { name: 'Debugging', level: 90, note: 'REPLACE — your approach to a hard bug.' },
        { name: 'Testing', level: 75, note: 'REPLACE — what you actually test.' },
        { name: 'Writing / Docs', level: 80, note: 'REPLACE — why this matters to you.' },
        { name: 'Code Review', level: 80, note: 'REPLACE — what you look for.' },
      ],
    },
  ],

  story: [
    {
      id: 'start',
      title: 'Where It Started',
      kind: 'professional',
      when: 'THE YEAR',
      body: [
        'REPLACE THIS PARAGRAPH. How you got into building things — the first thing you made that worked, and what it felt like when it did.',
        'Keep it concrete. One specific detail beats three adjectives.',
      ],
    },
    {
      id: 'now',
      title: 'What I Do Now',
      kind: 'professional',
      when: 'TODAY',
      body: [
        'REPLACE THIS PARAGRAPH. Your current role or focus, the kind of problems you take on, and the stack you are deepest in.',
      ],
    },
    {
      id: 'next',
      title: 'What I Am Chasing',
      kind: 'professional',
      when: 'NEXT',
      body: [
        'REPLACE THIS PARAGRAPH. What you want to work on next, and the kind of team you do your best work in.',
      ],
    },
    {
      id: 'offscreen',
      title: 'Away From The Keyboard',
      kind: 'personal',
      when: 'WEEKENDS',
      body: [
        'REPLACE THIS PARAGRAPH. What you do when you are not working. The hobby you will talk about for too long if someone lets you.',
      ],
    },
    {
      id: 'wiring',
      title: 'How I Am Wired',
      kind: 'personal',
      when: 'ALWAYS',
      body: [
        'REPLACE THIS PARAGRAPH. How you work and think — the thing colleagues notice about you first. Be honest rather than impressive.',
      ],
    },
    {
      id: 'fuel',
      title: 'Small Things I Like',
      kind: 'personal',
      when: 'DAILY',
      body: [
        'REPLACE THIS PARAGRAPH. The low-stakes specifics: a drink, a game, an album, a city, a keyboard. This is the section people remember.',
      ],
    },
  ],

  projects: [
    {
      id: 'project-one',
      title: 'PROJECT ONE',
      blurb:
        'REPLACE THIS. What it does and who it is for, in two sentences. Lead with the problem it solves, not the stack.',
      tech: ['React', 'TypeScript', 'Node.js'],
      github: 'https://github.com/YOUR_HANDLE/YOUR_REPO',
      live: 'https://your-project.example.com',
      highlight: 'REPLACE — the hardest part, and how you solved it.',
      featured: true,
    },
    {
      id: 'project-two',
      title: 'PROJECT TWO',
      blurb: 'REPLACE THIS. What it does and who it is for, in two sentences.',
      tech: ['Next.js', 'PostgreSQL'],
      github: 'https://github.com/YOUR_HANDLE/YOUR_REPO',
      highlight: 'REPLACE — what you learned building it.',
    },
    {
      id: 'project-three',
      title: 'PROJECT THREE',
      blurb: 'REPLACE THIS. What it does and who it is for, in two sentences.',
      tech: ['Python', 'FastAPI'],
      github: 'https://github.com/YOUR_HANDLE/YOUR_REPO',
      live: 'https://your-other-project.example.com',
      highlight: 'REPLACE — a decision you would make differently now.',
    },
    {
      id: 'project-four',
      title: 'PROJECT FOUR',
      blurb: 'REPLACE THIS, or delete this entry if you only want three projects.',
      tech: ['TypeScript', 'Canvas'],
      github: 'https://github.com/YOUR_HANDLE/YOUR_REPO',
    },
  ],

  contact: [
    {
      id: 'email',
      label: 'Email',
      value: 'YOUR.EMAIL@EXAMPLE.COM',
      href: 'mailto:YOUR.EMAIL@EXAMPLE.COM',
      copyable: true,
      icon: '✉',
    },
    {
      id: 'phone',
      label: 'Phone',
      value: '+00 00000 00000',
      href: 'tel:+0000000000',
      copyable: true,
      icon: '☎',
    },
    {
      id: 'github',
      label: 'GitHub',
      value: 'github.com/YOUR_HANDLE',
      href: 'https://github.com/YOUR_HANDLE',
      icon: '⌨',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: 'linkedin.com/in/YOUR_HANDLE',
      href: 'https://linkedin.com/in/YOUR_HANDLE',
      icon: '◈',
    },
    {
      id: 'location',
      label: 'Based in',
      value: 'YOUR CITY, COUNTRY',
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
