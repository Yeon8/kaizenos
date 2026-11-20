import type {
  DomainConfig,
  DomainId,
  EntrepreneurTask,
  SessionTemplate,
  WeeklyDayTemplate,
} from '../types/planner';

export const DOMAIN_ORDER: DomainId[] = [
  'meditation',
  'japanese',
  'guitar',
  'drawing',
  'bouldering',
  'entrepreneurship',
  'stretching',
];

export const DEFAULT_DOMAINS: Record<DomainId, DomainConfig> = {
  guitar: {
    id: 'guitar',
    name: 'Guitar',
    shortName: 'Guitar',
    level: 'intermediate',
    priority: 5,
    weeklyTargetDays: 6,
    defaultMinutes: 45,
    color: '#E6A84C',
    tracks: ['technical', 'ear_training', 'fretboard', 'repertoire', 'improv'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'guitar-s1',
        index: 0,
        title: 'Stage 1: Clean Mechanics & Time Lock',
        description:
          'Eliminate left/right-hand tension and build metronome subdivision accuracy.',
        milestones: [
          {
            id: 'g-m1',
            text: 'Play 16th-note alternate picking scales cleanly at 95+ BPM',
            completed: false,
          },
          {
            id: 'g-m2',
            text: 'Record a 1-bar rhythm groove switching cleanly between 8ths, triplets, and 16ths',
            completed: false,
          },
          {
            id: 'g-m3',
            text: 'Transcribe a 4-bar vocal or horn melody purely by ear',
            completed: false,
          },
        ],
      },
      {
        id: 'guitar-s2',
        index: 1,
        title: 'Stage 2: Fretboard Mapping & Triads',
        description:
          'Connect CAGED shapes and close/spread triads across the neck without guesswork.',
        milestones: [
          {
            id: 'g-m4',
            text: 'Voice-lead I–IV–V–vi across strings 2-3-4 and 1-2-3 without jumping >3 frets',
            completed: false,
          },
          {
            id: 'g-m5',
            text: 'Solo over a II-V-I targeting 3rds and 7ths on every chord change',
            completed: false,
          },
        ],
      },
      {
        id: 'guitar-s3',
        index: 2,
        title: 'Stage 3: Dynamic Phrasing & Repertoire Mastery',
        description:
          'Deliver complete pieces from memory with intentional articulation and tone.',
        milestones: [
          {
            id: 'g-m6',
            text: 'Perform 2 full intermediate-advanced pieces end-to-end with zero stops',
            completed: false,
          },
          {
            id: 'g-m7',
            text: 'Transcribe and analyze a full solo including bends, vibrato, and phrasing',
            completed: false,
          },
        ],
      },
    ],
  },

  drawing: {
    id: 'drawing',
    name: 'Drawing',
    shortName: 'Draw',
    level: 'beginner',
    priority: 5,
    weeklyTargetDays: 6,
    defaultMinutes: 45,
    color: '#E56B6F',
    tracks: ['fundamentals'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'draw-s1',
        index: 0,
        title: 'Stage 1: Line Confidence & Ghosting',
        description:
          'Draw from the shoulder with decisive, single-stroke confident marks (no chicken-scratching).',
        milestones: [
          {
            id: 'd-m1',
            text: 'Complete 4 pages of superimposed lines & ghosted lines with smooth endpoints',
            completed: false,
          },
          {
            id: 'd-m2',
            text: 'Draw 20 ghosted planes with clean diagonals and bisectors',
            completed: false,
          },
          {
            id: 'd-m3',
            text: 'Keep the 50% rule: 10+ minutes of pure fun drawing every session',
            completed: false,
          },
        ],
      },
      {
        id: 'draw-s2',
        index: 1,
        title: 'Stage 2: Ellipses & Planes in Space',
        description:
          'Control ellipse degree, minor axis alignment, and smooth 2-pass rotations.',
        milestones: [
          {
            id: 'd-m4',
            text: 'Fill 3 pages of tables of ellipses touching edges cleanly in 2 passes',
            completed: false,
          },
          {
            id: 'd-m5',
            text: 'Align ellipses inside rotated funnels along a single minor axis',
            completed: false,
          },
        ],
      },
      {
        id: 'draw-s3',
        index: 2,
        title: 'Stage 3: Perspective & Rotated Boxes',
        description:
          'Build intuitive 3D box construction and convergence without relying on rulers.',
        milestones: [
          {
            id: 'd-m6',
            text: 'Construct 100 freehand 3-point perspective boxes checking vanishing convergence',
            completed: false,
          },
          {
            id: 'd-m7',
            text: 'Complete a full rotated-box sphere exercise maintaining tight corner gaps',
            completed: false,
          },
        ],
      },
      {
        id: 'draw-s4',
        index: 3,
        title: 'Stage 4: Organic Form & Intersections',
        description:
          'Wrap contour curves around organic sausages and intersect solid volumes.',
        milestones: [
          {
            id: 'd-m8',
            text: 'Draw organic forms with believable hooked contour lines and cast shadows',
            completed: false,
          },
          {
            id: 'd-m9',
            text: 'Complete 3 pages of box/cylinder/sphere form intersections',
            completed: false,
          },
        ],
      },
      {
        id: 'draw-s5',
        index: 4,
        title: 'Stage 5: Gesture & Proportional Construction',
        description:
          'Capture rhythm, weight, and landmark proportions before rendering details.',
        milestones: [
          {
            id: 'd-m10',
            text: 'Complete 50 timed 60-second gesture poses emphasizing line of action',
            completed: false,
          },
          {
            id: 'd-m11',
            text: 'Construct 10 simplified Loomis heads from varied tilt angles',
            completed: false,
          },
        ],
      },
      {
        id: 'draw-s6',
        index: 5,
        title: 'Stage 6: Value, Light Logic & Studies',
        description:
          'Separate light from shadow cleanly using 2-value and 3-value shapes.',
        milestones: [
          {
            id: 'd-m12',
            text: 'Paint/shade 10 two-value Notan thumbnails from master artworks',
            completed: false,
          },
          {
            id: 'd-m13',
            text: 'Render 5 still-life studies showing clear core shadow, terminator, and bounce light',
            completed: false,
          },
        ],
      },
    ],
  },

  japanese: {
    id: 'japanese',
    name: 'Japanese',
    shortName: 'Japanese',
    level: 'intermediate',
    priority: 5,
    weeklyTargetDays: 7,
    defaultMinutes: 55,
    color: '#6B8EFE',
    tracks: ['srs', 'reading_mining', 'audio_shadowing', 'output_pitch'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'jp-s1',
        index: 0,
        title: 'Stage 1: N4→N3 Bridge & Daily Mining Habit',
        description:
          'Clear SRS reliably every morning and mine high-frequency i+1 sentences from native content.',
        milestones: [
          {
            id: 'jp-m1',
            text: 'Maintain 14 consecutive days of zero-backlog morning SRS reviews',
            completed: false,
          },
          {
            id: 'jp-m2',
            text: 'Mine 100 clean i+1 native sentence cards with audio',
            completed: false,
          },
        ],
      },
      {
        id: 'jp-s2',
        index: 1,
        title: 'Stage 2: Fluid Native Reading & Audio Parsing',
        description:
          'Consume slice-of-life manga, novels, and conversational podcasts with minimal dictionary friction.',
        milestones: [
          {
            id: 'jp-m3',
            text: 'Finish 1 light novel / manga volume tracking lookups without burnout',
            completed: false,
          },
          {
            id: 'jp-m4',
            text: 'Shadow 30 minutes of natural native dialogue matching rhythm & pitch',
            completed: false,
          },
        ],
      },
      {
        id: 'jp-s3',
        index: 2,
        title: 'Stage 3: Natural Output & N2 Precision',
        description:
          'Express nuanced ideas in writing and speech with natural pitch contour and grammar.',
        milestones: [
          {
            id: 'jp-m5',
            text: 'Write 15 native diary entries / conversations corrected by native feedback',
            completed: false,
          },
          {
            id: 'jp-m6',
            text: 'Reach 90%+ comprehension on unscripted Japanese podcasts',
            completed: false,
          },
        ],
      },
    ],
  },

  bouldering: {
    id: 'bouldering',
    name: 'Bouldering',
    shortName: 'Boulder',
    level: 'intermediate',
    priority: 5,
    weeklyTargetDays: 3,
    defaultMinutes: 90,
    color: '#2EC4B6',
    tracks: ['limit', 'volume', 'capacity'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'climb-s1',
        index: 0,
        title: 'Stage 1: Intermediate Movement Economy',
        description:
          'Eliminate over-gripping and feet-cutting; master flagging, drop-knees, and rest pacing.',
        milestones: [
          {
            id: 'c-m1',
            text: 'Climb 12 consecutive volume problems with silent, no-adjust foot placements',
            completed: false,
          },
          {
            id: 'c-m2',
            text: 'Observe strict 3–4 min rests on limit attempts across 4 sessions',
            completed: false,
          },
        ],
      },
      {
        id: 'climb-s2',
        index: 1,
        title: 'Stage 2: Anti-Style & Limit Breakthrough',
        description:
          'Attack weakest wall angles/hold types and recruit max tension on project moves.',
        milestones: [
          {
            id: 'c-m3',
            text: 'Send a multi-session project at or above current peak grade',
            completed: false,
          },
          {
            id: 'c-m4',
            text: 'Send 3 problems in your anti-style (slopers, slab, or steep compression)',
            completed: false,
          },
        ],
      },
    ],
  },

  entrepreneurship: {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    shortName: 'Ventures',
    level: 'intermediate',
    priority: 3, // Secondary behind skills & physical per user preference
    weeklyTargetDays: 6,
    defaultMinutes: 75,
    color: '#A78BFA',
    tracks: ['deep_work'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'ent-s1',
        index: 0,
        title: 'Stage 1: Daily Single-Domino Execution',
        description:
          'Ship one tangible high-leverage build, user conversation, or distribution asset daily.',
        milestones: [
          {
            id: 'e-m1',
            text: 'Complete 10 uninterrupted Single-Domino sprints with concrete deliverables',
            completed: false,
          },
          {
            id: 'e-m2',
            text: 'Run 5 real customer / user feedback loops or outreach pushes',
            completed: false,
          },
        ],
      },
      {
        id: 'ent-s2',
        index: 1,
        title: 'Stage 2: Compounding Distribution & Feedback',
        description:
          'Tighten build-measure-learn cycles around verified user demand and revenue.',
        milestones: [
          {
            id: 'e-m3',
            text: 'Ship an MVP iteration driven directly by user feedback',
            completed: false,
          },
          {
            id: 'e-m4',
            text: 'Establish repeatable weekly distribution cadence',
            completed: false,
          },
        ],
      },
    ],
  },

  meditation: {
    id: 'meditation',
    name: 'Meditation',
    shortName: 'Meditate',
    level: 'beginner',
    priority: 4,
    weeklyTargetDays: 7,
    defaultMinutes: 8,
    color: '#68D391',
    tracks: ['mindfulness'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'med-s1',
        index: 0,
        title: 'Stage 1: 8m Breath Anchor',
        description:
          'Build an unbreakable daily habit returning attention gently to breath sensations.',
        milestones: [
          {
            id: 'm-m1',
            text: 'Complete 5 sits of 8 minutes without skipping',
            completed: false,
          },
        ],
      },
      {
        id: 'med-s2',
        index: 1,
        title: 'Stage 2: 10m Thought Labeling',
        description:
          'Catch mind-wandering earlier by softly noting "thinking" or "planning" without judgment.',
        milestones: [
          {
            id: 'm-m2',
            text: 'Complete 7 sits of 10 minutes with calm noting',
            completed: false,
          },
        ],
      },
      {
        id: 'med-s3',
        index: 2,
        title: 'Stage 3: 12m Somatic Body Scan',
        description:
          'Develop proprioceptive awareness and down-regulate baseline tension.',
        milestones: [
          {
            id: 'm-m3',
            text: 'Complete 7 sits of 12 minutes sweeping tension top-to-bottom',
            completed: false,
          },
        ],
      },
      {
        id: 'med-s4',
        index: 3,
        title: 'Stage 4: 15m Open Awareness',
        description:
          'Expand attention from narrow breath to spacious awareness of thoughts and sounds.',
        milestones: [
          {
            id: 'm-m4',
            text: 'Complete 10 sits of 15 minutes',
            completed: false,
          },
        ],
      },
      {
        id: 'med-s5',
        index: 4,
        title: 'Stage 5: 20m Unassisted Presence',
        description: 'Sustain effortless quiet clarity for 20 minutes daily.',
        milestones: [
          {
            id: 'm-m5',
            text: 'Complete 14 sits of 20 minutes',
            completed: false,
          },
        ],
      },
    ],
  },

  stretching: {
    id: 'stretching',
    name: 'Stretching & Mobility',
    shortName: 'Stretch',
    level: 'beginner',
    priority: 4,
    weeklyTargetDays: 7,
    defaultMinutes: 18,
    color: '#F4A261',
    tracks: ['hips_lower', 'forearms_thoracic', 'full_decompress'],
    currentStageIndex: 0,
    customDrills: [],
    stages: [
      {
        id: 'str-s1',
        index: 0,
        title: 'Stage 1: Pain-Free Baseline & Tendon Hygiene',
        description:
          'Restore hip turnout for climbing, wrist/forearm balance for guitar, and evening sleep calm.',
        milestones: [
          {
            id: 's-m1',
            text: 'Complete 7 evening decompression routines without forcing pain',
            completed: false,
          },
          {
            id: 's-m2',
            text: 'Hold 90/90 hip switches and deep resting squat comfortably for 60s',
            completed: false,
          },
        ],
      },
      {
        id: 'str-s2',
        index: 1,
        title: 'Stage 2: End-Range Control & High-Step Mobility',
        description:
          'Own active flexibility for high rockovers, shoulder overhead reach, and posture.',
        milestones: [
          {
            id: 's-m3',
            text: 'Add 10-second gentle isometric contractions at end range in hip & thoracic poses',
            completed: false,
          },
          {
            id: 's-m4',
            text: 'Maintain 14-day streak of post-session forearm & hip care',
            completed: false,
          },
        ],
      },
    ],
  },
};

export const SESSION_TEMPLATES: SessionTemplate[] = [
  // ======================== GUITAR ========================
  {
    id: 'guitar-tech',
    domainId: 'guitar',
    title: 'Technical Precision & Speed Pyramids',
    track: 'technical',
    level: 'intermediate',
    targetMinutes: 45,
    intensity: 'high',
    fingerLoad: 2,
    methodologyNote:
      'Speed comes from relaxation and micro-bursts just above your clean threshold—never grinding sloppy tension.',
    phases: [
      {
        id: 'gt-p1',
        title: 'Relaxation & Sync Warmup',
        minutes: 10,
        instruction:
          'Play single-string chromatic/scale permutations at 65 BPM with minimal fret pressure. Notice and release shoulder, jaw, and picking-wrist tension.',
        toolHint: 'metronome',
      },
      {
        id: 'gt-p2',
        title: 'Clean-Edge BPM Bursts',
        minutes: 20,
        instruction:
          'Pick one 1–2 bar lick or picking pattern. Loop 4 clean reps at baseline BPM, bump +4 BPM for short bursts, drop -2 BPM at first sign of buzz or tension.',
        toolHint: 'metronome',
      },
      {
        id: 'gt-p3',
        title: 'Musical Context Integration',
        minutes: 15,
        instruction:
          'Play the target technique inside a real musical groove or backing track at 85% of your peak clean BPM so phrasing stays musical.',
        toolHint: 'metronome',
      },
    ],
  },
  {
    id: 'guitar-ear',
    domainId: 'guitar',
    title: 'Ear Training & Phrase Transcription',
    track: 'ear_training',
    level: 'intermediate',
    targetMinutes: 40,
    intensity: 'low',
    fingerLoad: 1,
    methodologyNote:
      'Transcribing without tabs bridges the gap between what you hear internally and where your fingers land.',
    phases: [
      {
        id: 'ge-p1',
        title: 'Sing & Locate Intervals',
        minutes: 10,
        instruction:
          'Play a drone root note, sing 3rds, 5ths, 6ths, and 7ths aloud BEFORE fretting them to check pitch.',
        toolHint: 'metronome',
      },
      {
        id: 'ge-p2',
        title: 'Transcribe 4–8 Bars by Ear',
        minutes: 20,
        instruction:
          'Pick a short solo or vocal melody. Loop 2 seconds at a time, sing the phrase first, then find the exact pitches and rhythms on the neck.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'ge-p3',
        title: 'Transpose to Two Neck Positions',
        minutes: 10,
        instruction:
          'Play the transcribed phrase in a second octave/position and in one new key to lock in interval shapes.',
        toolHint: 'metronome',
      },
    ],
  },
  {
    id: 'guitar-fretboard',
    domainId: 'guitar',
    title: 'Fretboard Fluency: Triads & Voice Leading',
    track: 'fretboard',
    level: 'intermediate',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 1,
    methodologyNote:
      'Thinking in chord tones and nearest-neighbor voice leading eliminates scale-box meandering.',
    phases: [
      {
        id: 'gf-p1',
        title: 'Horizontal Triad Mapping',
        minutes: 10,
        instruction:
          'Name notes aloud while running major/minor triads horizontally up string sets 1-2-3 and 2-3-4.',
        toolHint: 'metronome',
      },
      {
        id: 'gf-p2',
        title: 'Nearest-Position Progression Loop',
        minutes: 20,
        instruction:
          'Set metronome to 72 BPM. Voice-lead I–V–vi–IV staying strictly inside one 4-fret zone.',
        toolHint: 'metronome',
      },
      {
        id: 'gf-p3',
        title: 'Arpeggio & Approach-Note Connecting',
        minutes: 15,
        instruction:
          'Connect chord changes using half-step chromatic or diatonic approach notes into the 3rd of each new chord.',
        toolHint: 'metronome',
      },
    ],
  },
  {
    id: 'guitar-repertoire',
    domainId: 'guitar',
    title: 'Repertoire Chunking & Clean Takes',
    track: 'repertoire',
    level: 'intermediate',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 2,
    methodologyNote:
      'Practice the hardest 2 bars backward from the transition point instead of restarting from bar 1.',
    phases: [
      {
        id: 'gr-p1',
        title: 'Trouble-Spot Micro-Loops',
        minutes: 15,
        instruction:
          'Isolate the two weakest transitions in your piece. Practice slow (70%) until you execute 5 consecutive error-free loops.',
        toolHint: 'metronome',
      },
      {
        id: 'gr-p2',
        title: 'Section Stitching',
        minutes: 15,
        instruction:
          'Link 4 bars before and 4 bars after each trouble spot at 85%–95% tempo without breaking groove.',
        toolHint: 'metronome',
      },
      {
        id: 'gr-p3',
        title: 'One-Take Performance Simulation',
        minutes: 15,
        instruction:
          'Do 2 full cold run-throughs without stopping for mistakes—note where recovery happened for next session.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'guitar-improv',
    domainId: 'guitar',
    title: 'Targeted Improvisation & Motif Craft',
    track: 'improv',
    level: 'intermediate',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 1,
    methodologyNote:
      'Constraints force creativity: limiting strings, rhythms, or notes turns random noodling into intentional storytelling.',
    phases: [
      {
        id: 'gi-p1',
        title: '2-String / 3-Note Motif Drill',
        minutes: 15,
        instruction:
          'Improvise over a backing track using only 3 notes on strings 2 & 3. Develop rhythmic variation and space.',
        toolHint: 'metronome',
      },
      {
        id: 'gi-p2',
        title: 'Call & Response Phrasing',
        minutes: 15,
        instruction:
          'Play a 2-bar question phrase ending on tension, leave 1 beat of air, then answer cleanly on a chord tone.',
        toolHint: 'metronome',
      },
      {
        id: 'gi-p3',
        title: 'Full Solo Arc',
        minutes: 15,
        instruction:
          'Shape a 2-minute solo starting sparse and low, building rhythmic density in the middle, and resolving cleanly.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'guitar-recovery',
    domainId: 'guitar',
    title: 'Low-Tension Ear & Neck Visualization (Tendon Sparing)',
    track: 'recovery',
    level: 'intermediate',
    targetMinutes: 30,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Selected automatically when tendon load is high: maximizes musical growth with near-zero flexor strain.',
    phases: [
      {
        id: 'grec-p1',
        title: 'Rhythm Subdivision & Internal Clock',
        minutes: 10,
        instruction:
          'Mute strings lightly and practice muted funk/polyrhythmic strumming patterns or clap syncopations against beats 2 & 4.',
        toolHint: 'metronome',
      },
      {
        id: 'grec-p2',
        title: 'Ear Recognition & Feather-Touch Mapping',
        minutes: 20,
        instruction:
          'Identify chord progressions by ear and trace triad shapes on the fretboard using feather-light touch (zero barre chords or heavy bends).',
        toolHint: 'focus_sprint',
      },
    ],
  },

  // ======================== DRAWING (BEGINNER STAGES) ========================
  {
    id: 'drawing-stage-1',
    domainId: 'drawing',
    title: 'Line Confidence & Ghosting (Stage 1)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Confidence before accuracy: draw from your shoulder in one smooth sweep, then balance study with 10m of pure fun drawing.',
    phases: [
      {
        id: 'dr1-p1',
        title: 'Shoulder Warmup: Superimposed Lines',
        minutes: 10,
        instruction:
          'Draw 2 pages of straight & gentle curved lines using a ruler for the first pass, then ghost and trace 6x smoothly from the shoulder.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr1-p2',
        title: 'Ghosted Lines & Planes Drill',
        minutes: 25,
        instruction:
          'Plot two dots, ghost the motion 3–4 times, and commit to one decisive stroke. Connect 4 lines into perspective planes and bisect them.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr1-p3',
        title: '50% Rule: Free Fun Sketching',
        minutes: 10,
        instruction:
          'Put fundamentals aside and draw whatever excites you—creatures, architecture, comics—zero self-critique allowed.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'drawing-stage-2',
    domainId: 'drawing',
    title: 'Ellipses & Spatial Planes (Stage 2)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Always draw through ellipses 2 full passes and orient every ellipse around a clear minor axis.',
    phases: [
      {
        id: 'dr2-p1',
        title: 'Ghosted Planes Warmup',
        minutes: 10,
        instruction:
          'Warm up your shoulder with 10 clean ghosted planes of varied angles before drawing ellipses inside.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr2-p2',
        title: 'Tables of Ellipses & Funnels',
        minutes: 25,
        instruction:
          'Fill a page of constrained ellipses touching borders in 2 passes, then draw funnels widening ellipse degree outward along a single center axis.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr2-p3',
        title: '50% Rule: Fun Drawing',
        minutes: 10,
        instruction:
          'Sketch anything playful for 10 minutes—vehicles, mugs, characters—without worrying about mistakes.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'drawing-stage-3',
    domainId: 'drawing',
    title: '3D Boxes & Perspective Convergence (Stage 3)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Boxes are the building blocks of everything. Checking your own converging lines trains 3D spatial intuition fast.',
    phases: [
      {
        id: 'dr3-p1',
        title: 'Lines & Ellipses Warmup',
        minutes: 10,
        instruction:
          'Quickly run 1 page of ghosted lines and ellipses to wake up shoulder control.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr3-p2',
        title: 'Freehand 3-Point Boxes + Line Check',
        minutes: 25,
        instruction:
          'Draw 6–8 Y-method boxes at varied rotations. Afterward, use a straightedge + colored pen to extend edges and inspect vanishing convergence.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr3-p3',
        title: '50% Rule: Fun Drawing',
        minutes: 10,
        instruction:
          'Create something strictly for enjoyment—prop design, fan sketch, or imaginative doodle.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'drawing-stage-4',
    domainId: 'drawing',
    title: 'Organic Volumes & Form Intersections (Stage 4)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Think of every line as wrapping over a solid 3D clay form rather than sitting flat on paper.',
    phases: [
      {
        id: 'dr4-p1',
        title: 'Warmup: Ghosted Curves & Ellipses',
        minutes: 10,
        instruction: 'Practice smooth S-curves and degree-shifted ellipses.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr4-p2',
        title: 'Organic Sausages & Form Intersections',
        minutes: 25,
        instruction:
          'Draw organic sausages with wrapping contour curves that hook around the silhouette, then stack and intersect simple forms cleanly.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr4-p3',
        title: '50% Rule: Fun Drawing',
        minutes: 10,
        instruction: 'Draw from imagination or favorite references purely for enjoyment.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'drawing-stage-5',
    domainId: 'drawing',
    title: 'Gesture, Flow & Proportions (Stage 5)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Capture energy and weight in the first 30 seconds before placing anatomical landmarks.',
    phases: [
      {
        id: 'dr5-p1',
        title: '10m Timed Gesture Sprint (30s–60s)',
        minutes: 10,
        instruction:
          'Use pose references: capture head-tilt, ribcage, pelvis flow, and line of action with max 10 strokes per figure.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr5-p2',
        title: '2–5m Construction & Proportion Studies',
        minutes: 25,
        instruction:
          'Build simplified 3D ribcage/pelvis masses or Loomis heads checking negative space and plumb-line alignments.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr5-p3',
        title: '50% Rule: Character/Scene Sketch',
        minutes: 10,
        instruction: 'Invent an expressive character pose or scene purely for fun.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'drawing-stage-6',
    domainId: 'drawing',
    title: 'Value Grouping & Light Logic (Stage 6)',
    track: 'fundamentals',
    level: 'beginner',
    targetMinutes: 45,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Strong 2-value light/shadow separation beats high-detail rendering every time.',
    phases: [
      {
        id: 'dr6-p1',
        title: '2-Value Notan Thumbnails',
        minutes: 10,
        instruction:
          'Squint at 2 references and block pure black vs pure white shadow shapes in tiny 2x3" boxes.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr6-p2',
        title: '3-Tone Light & Form Study',
        minutes: 25,
        instruction:
          'Render a simple still life or master study separating light, midtone, and core shadow + cast shadow cleanly.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'dr6-p3',
        title: '50% Rule: Free Illustration',
        minutes: 10,
        instruction: 'Make a moody, fun personal sketch playing with dramatic light.',
        toolHint: 'focus_sprint',
      },
    ],
  },

  // ======================== JAPANESE ========================
  {
    id: 'jp-srs-micro',
    domainId: 'japanese',
    title: 'Morning SRS & Kanji Recall',
    track: 'srs',
    level: 'intermediate',
    targetMinutes: 15,
    intensity: 'low',
    fingerLoad: 0,
    isMicroBlock: true,
    methodologyNote:
      'Morning recall locks memories fast while willpower is high—cap at 15m so immersion gets the lion’s share.',
    phases: [
      {
        id: 'jp-srs-p1',
        title: 'Focused SRS Due Queue',
        minutes: 12,
        instruction:
          'Clear Anki/SRS reviews briskly (<8s per card). Grade honestly; suspend/bury chronic leeches to stay under 15m.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'jp-srs-p2',
        title: 'New Mined Cards Preview',
        minutes: 3,
        instruction:
          'Add or preview 5–8 clean i+1 sentence cards mined from yesterday’s immersion.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'jp-reading-mining',
    domainId: 'japanese',
    title: 'Active Native Reading & i+1 Mining',
    track: 'reading_mining',
    level: 'intermediate',
    targetMinutes: 40,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Read slightly above comfort (85–95% known) and mine only sentences with exactly one unknown word or nuance.',
    phases: [
      {
        id: 'jp-rm-p1',
        title: 'Flow Reading (Pop-up Dictionary)',
        minutes: 25,
        instruction:
          'Read native manga, novel, or NHK/note article. Lookup fast without breaking story momentum; skip rare one-off words.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'jp-rm-p2',
        title: 'Curate 5–8 i+1 Cards',
        minutes: 15,
        instruction:
          'Select the best 5–8 useful i+1 sentences you actually want to use/understand and add audio or context notes.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'jp-audio-shadowing',
    domainId: 'japanese',
    title: 'Raw Listening & Prosody Shadowing',
    track: 'audio_shadowing',
    level: 'intermediate',
    targetMinutes: 40,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Shadowing native speech 0.2s behind the speaker rewires mouth mechanics, rhythm, and natural pitch contour.',
    phases: [
      {
        id: 'jp-as-p1',
        title: 'Active Unscripted Listening',
        minutes: 20,
        instruction:
          'Listen to a Japanese podcast or native dialogue with zero English subtitles. Rewind tricky turns of phrase once, then keep flowing.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'jp-as-p2',
        title: 'Focused Chorus Shadowing',
        minutes: 20,
        instruction:
          'Loop a 2–3 minute native audio clip and shadow aloud matching speed, pitch drop, and emotion.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'jp-output-pitch',
    domainId: 'japanese',
    title: 'Active Output, Journaling & Pitch Check',
    track: 'output_pitch',
    level: 'intermediate',
    targetMinutes: 40,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Output reveals the exact grammar gaps input hides. Short daily synthesis turns passive vocab active.',
    phases: [
      {
        id: 'jp-op-p1',
        title: 'Recall & Summarize Without Dictionary',
        minutes: 20,
        instruction:
          'Write 150–250 Japanese characters summarizing something you read/watched or planning your venture—use newly mined words.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'jp-op-p2',
        title: 'Corrections & Spoken Reading Aloud',
        minutes: 20,
        instruction:
          'Verify natural phrasing/pitch accents on uncertain words, then read the corrected passage aloud 3 times smoothly.',
        toolHint: 'focus_sprint',
      },
    ],
  },

  // ======================== BOULDERING ========================
  {
    id: 'boulder-limit',
    domainId: 'bouldering',
    title: 'Limit Projecting & Max Recruitment',
    track: 'limit',
    level: 'intermediate',
    targetMinutes: 90,
    intensity: 'high',
    fingerLoad: 3,
    methodologyNote:
      'True strength gains require full ATP-PCr recovery (3–4m rest) and stopping the moment power drops ~15%.',
    phases: [
      {
        id: 'bl-p1',
        title: 'Progressive Ramp & Shoulder Activation',
        minutes: 20,
        instruction:
          '5m band/scapular prep + traverse, then climb 4 easy-to-moderate problems (V0→V3) focusing on open-hand half-crimp recruitment.',
        toolHint: 'rest_timer',
      },
      {
        id: 'bl-p2',
        title: 'Limit Project Burns (3–4m Strict Rest)',
        minutes: 55,
        instruction:
          'Pick 2–3 hard project boulders at your edge. Give high-intent quality burns with mandatory 3–4 minute rest timer between attempts. Stop if power drops!',
        toolHint: 'rest_timer',
      },
      {
        id: 'bl-p3',
        title: 'Antagonist Prehab & Cooldown',
        minutes: 15,
        instruction:
          '2–3 sets each: wrist/finger extensor band openings, scapular pushups, and shoulder external rotations.',
        toolHint: 'rest_timer',
      },
    ],
  },
  {
    id: 'boulder-volume',
    domainId: 'bouldering',
    title: 'Silent-Feet Volume & Movement Precision',
    track: 'volume',
    level: 'intermediate',
    targetMinutes: 85,
    intensity: 'moderate',
    fingerLoad: 2,
    methodologyNote:
      'Moderate-grade volume with strict technical constraints builds effortless economy without trashing pulley tendons.',
    phases: [
      {
        id: 'bv-p1',
        title: 'RAMP Warmup & Hip-In Traverse',
        minutes: 15,
        instruction:
          'Warm up shoulders, hips, and fingers gradually across easy jugs and slopers.',
        toolHint: 'rest_timer',
      },
      {
        id: 'bv-p2',
        title: '10–14 Technical Constraint Boulders',
        minutes: 55,
        instruction:
          'Climb problems 2 grades below max with rules: ZERO foot noise, 2-second hand hover before grabbing, and deliberate flagging/twistlocks. Rest 2m.',
        toolHint: 'rest_timer',
      },
      {
        id: 'bv-p3',
        title: 'Core Tension & Forearm Balance',
        minutes: 15,
        instruction:
          'Hollow-body holds / slow leg raises plus finger extensor balance reps.',
        toolHint: 'rest_timer',
      },
    ],
  },
  {
    id: 'boulder-capacity',
    domainId: 'bouldering',
    title: 'Anti-Style Attack & Capacity',
    track: 'capacity',
    level: 'intermediate',
    targetMinutes: 85,
    intensity: 'moderate',
    fingerLoad: 2,
    methodologyNote:
      'Attacking weak hold types and wall angles unlocks the fastest grade jumps while building work capacity.',
    phases: [
      {
        id: 'bc-p1',
        title: 'Warmup & Tension Drills',
        minutes: 15,
        instruction:
          'Progressive climbing warmup targeting open-hand grips, heel hooks, and shoulder engagement.',
        toolHint: 'rest_timer',
      },
      {
        id: 'bc-p2',
        title: 'Anti-Style Pairs (Sloper / Steep / Slab)',
        minutes: 55,
        instruction:
          'Select 4 problems in your weakest style. Climb 2 back-to-back or in controlled rounds with 2–3m rest, analyzing body position after each fall.',
        toolHint: 'rest_timer',
      },
      {
        id: 'bc-p3',
        title: 'Shoulder Stability & Antagonists',
        minutes: 15,
        instruction:
          'Face-pulls/band pull-aparts + wrist extensor work to keep elbows & shoulders bulletproof.',
        toolHint: 'rest_timer',
      },
    ],
  },
  {
    id: 'boulder-recovery',
    domainId: 'bouldering',
    title: 'Active Tendon Recovery & Slab Footwork',
    track: 'recovery',
    level: 'intermediate',
    targetMinutes: 45,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Auto-selected when cumulative finger fatigue is elevated—stimulates collagen blood flow & balance without micro-tearing pulleys.',
    phases: [
      {
        id: 'br-p1',
        title: 'Blood-Flow Warmup & Easy Traverse',
        minutes: 15,
        instruction:
          'Light finger tendon glides, rice-bucket or band extensions, and easy large-hold traversing.',
        toolHint: 'rest_timer',
      },
      {
        id: 'br-p2',
        title: 'No-Hands / Low-Grip Balance Slab',
        minutes: 15,
        instruction:
          'Practice weight transfers, smearing, and high steps on low-angle slabs keeping grip pressure <20%.',
        toolHint: 'rest_timer',
      },
      {
        id: 'br-p3',
        title: 'Antagonist & Mobility Reset',
        minutes: 15,
        instruction:
          'Gentle forearm extensor pumping, thoracic openers, and deep breathing.',
        toolHint: 'stretch_guide',
      },
    ],
  },

  // ======================== ENTREPRENEURSHIP ========================
  {
    id: 'ent-domino-build',
    domainId: 'entrepreneurship',
    title: 'Single-Domino Deep Work Sprint',
    track: 'deep_work',
    level: 'intermediate',
    targetMinutes: 75,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'Protected secondary deep work: pick ONE concrete shippable outcome so you build real momentum without context-switching.',
    phases: [
      {
        id: 'ed-p1',
        title: 'Lock the Single Domino',
        minutes: 5,
        instruction:
          'Close messaging/email tabs. Confirm the exact artifact or shippable milestone you will finish in the next 60 minutes.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'ed-p2',
        title: 'Uninterrupted Creation / Execution',
        minutes: 60,
        instruction:
          'Execute relentlessly on the Domino. If a tangent idea pops up, drop it in the distraction scratchpad and stay on target.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'ed-p3',
        title: 'Ship & Set Next Micro-Step',
        minutes: 10,
        instruction:
          'Deploy/publish/send what you built and write the first 5-minute entry task for tomorrow’s sprint.',
        toolHint: 'focus_sprint',
      },
    ],
  },
  {
    id: 'ent-distribution',
    domainId: 'entrepreneurship',
    title: 'Customer Discovery & Distribution Sprint',
    track: 'deep_work',
    level: 'intermediate',
    targetMinutes: 60,
    intensity: 'moderate',
    fingerLoad: 0,
    methodologyNote:
      'High-leverage output fails without distribution—pair building days with direct user outreach and feedback.',
    phases: [
      {
        id: 'edd-p1',
        title: 'Prep Target List & Hook',
        minutes: 10,
        instruction:
          'Identify 5–10 specific prospects/users or one distribution channel to focus on right now.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'edd-p2',
        title: 'Outreach, Content or User Calls',
        minutes: 40,
        instruction:
          'Send personalized outreach, run discovery chats, or publish/distribute value directly to users.',
        toolHint: 'focus_sprint',
      },
      {
        id: 'edd-p3',
        title: 'Capture Signal & Hypothesis',
        minutes: 10,
        instruction:
          'Log objections, resonance signals, and tomorrow’s product/messaging adjustment.',
        toolHint: 'focus_sprint',
      },
    ],
  },

  // ======================== MEDITATION (BEGINNER RAMP) ========================
  {
    id: 'med-anchor',
    domainId: 'meditation',
    title: 'Breath Anchor Baseline (8m)',
    track: 'mindfulness',
    level: 'beginner',
    targetMinutes: 8,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Every time you notice your mind wandered and gently return to the breath, that IS a successful rep.',
    phases: [
      {
        id: 'ma-p1',
        title: 'Posture & Physiological Sigh',
        minutes: 1,
        instruction:
          'Sit upright with relaxed shoulders. Take 2 double-inhale physiological sighs, then let breathing turn natural.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'ma-p2',
        title: 'Nostril Breath Anchor',
        minutes: 6,
        instruction:
          'Follow the sensation of air at your nostrils or belly. Count breaths 1 to 10; restart kindly at 1 whenever distracted.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'ma-p3',
        title: 'Gentle Transition',
        minutes: 1,
        instruction:
          'Widen awareness to room sounds and posture before opening your eyes.',
        toolHint: 'meditation_bell',
      },
    ],
  },
  {
    id: 'med-labeling',
    domainId: 'meditation',
    title: 'Thought Labeling (10m)',
    track: 'mindfulness',
    level: 'beginner',
    targetMinutes: 10,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Naming distractions softly reduces emotional stickiness and accelerates metacognitive awareness.',
    phases: [
      {
        id: 'ml-p1',
        title: 'Settle & Ground',
        minutes: 1,
        instruction: 'Relax jaw and hands; anchor on the rhythm of breathing.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'ml-p2',
        title: 'Soft Noting Practice',
        minutes: 8,
        instruction:
          'When attention drifts, softly note "thinking", "planning", or "hearing", then smile slightly and return to the breath.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'ml-p3',
        title: 'Open Settle',
        minutes: 1,
        instruction: 'Release the noting technique and sit quietly for the final minute.',
        toolHint: 'meditation_bell',
      },
    ],
  },
  {
    id: 'med-body-scan',
    domainId: 'meditation',
    title: 'Somatic Body Scan (12m)',
    track: 'mindfulness',
    level: 'beginner',
    targetMinutes: 12,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Scanning physical sensations grounds restless thoughts and reduces baseline forearm/shoulder tension.',
    phases: [
      {
        id: 'mb-p1',
        title: 'Breath Grounding',
        minutes: 2,
        instruction: 'Take 5 calm breaths settling weight into the chair or cushion.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'mb-p2',
        title: 'Crown-to-Toes Scan',
        minutes: 9,
        instruction:
          'Move attention slowly through forehead, jaw, neck, shoulders, forearms, fingers, chest, hips, and feet—softening micro-tension.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'mb-p3',
        title: 'Whole-Body Presence',
        minutes: 1,
        instruction: 'Feel the whole body breathing as one unified field.',
        toolHint: 'meditation_bell',
      },
    ],
  },
  {
    id: 'med-open',
    domainId: 'meditation',
    title: 'Open Awareness (15m)',
    track: 'mindfulness',
    level: 'intermediate',
    targetMinutes: 15,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Transition from narrow focus to spacious non-reactive awareness of anything entering consciousness.',
    phases: [
      {
        id: 'mo-p1',
        title: 'Breath Anchor Entry',
        minutes: 3,
        instruction: 'Establish calm stability using natural breath.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'mo-p2',
        title: 'Spacious Open Awareness',
        minutes: 11,
        instruction:
          'Drop narrow tracking and let sounds, sensations, and thoughts arise and dissolve without grasping.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'mo-p3',
        title: 'Close',
        minutes: 1,
        instruction: 'Set a clear calm intention for your next block.',
        toolHint: 'meditation_bell',
      },
    ],
  },
  {
    id: 'med-deep',
    domainId: 'meditation',
    title: 'Unassisted Deep Sit (20m)',
    track: 'mindfulness',
    level: 'intermediate',
    targetMinutes: 20,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Longer unguided sits deepen equanimity and sustained focus across coding, music, and climbing.',
    phases: [
      {
        id: 'md-p1',
        title: 'Settle',
        minutes: 2,
        instruction: 'Align spine, drop shoulders, begin gentle breath awareness.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'md-p2',
        title: 'Sustained Presence',
        minutes: 17,
        instruction: 'Maintain clear, relaxed vigilance—neither straining nor spacing out.',
        toolHint: 'meditation_bell',
      },
      {
        id: 'md-p3',
        title: 'Integration',
        minutes: 1,
        instruction: 'Transition smoothly back to movement.',
        toolHint: 'meditation_bell',
      },
    ],
  },

  // ======================== STRETCHING (BEGINNER) ========================
  {
    id: 'stretch-hips',
    domainId: 'stretching',
    title: 'Climber Hips, Hamstrings & Squat Mobility',
    track: 'hips_lower',
    level: 'beginner',
    targetMinutes: 18,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Evening stretch sessions build turnout for high climbing steps while down-regulating your nervous system for sleep.',
    phases: [
      {
        id: 'sh-p1',
        title: 'Guided Lower-Body Mobility Sequence',
        minutes: 18,
        instruction:
          'Move slowly with 4s nasal inhales and 6s relaxed exhales. Stop at mild 6/10 tension—never sharp joint pain.',
        toolHint: 'stretch_guide',
        stretchPoses: [
          {
            id: 'pose-9090',
            name: '90/90 Hip Switches & Lean',
            target: 'Hip External & Internal Rotation',
            holdSeconds: 60,
            bilateral: true,
            cue: 'Sit tall with front shin at 90°, hinge chest slightly toward front shin without rounding spine.',
          },
          {
            id: 'pose-frog',
            name: 'Supported Frog Stretch',
            target: 'Adductors & Turnout (Climbing High-Steps)',
            holdSeconds: 75,
            bilateral: false,
            cue: 'Knees wide on mat/towel, shins parallel, gently rock hips back an inch on each exhale.',
          },
          {
            id: 'pose-couch',
            name: 'Kneeling Hip Flexor Lunge',
            target: 'Psoas & Quads (Countering Desk Posture)',
            holdSeconds: 50,
            bilateral: true,
            cue: 'Tuck tailbone under first (posterior pelvic tilt) before shifting weight forward—keep glute gently active.',
          },
          {
            id: 'pose-ham',
            name: 'Bent-Knee Seated Hamstring Hinge',
            target: 'Hamstrings & Sciatic Glide',
            holdSeconds: 50,
            bilateral: true,
            cue: 'Slight knee bend, hinge from hip crease with flat back; flex and point toes gently for nerve mobility.',
          },
          {
            id: 'pose-squat',
            name: 'Deep Resting Squat Hold',
            target: 'Ankles, Hips & Lower Back',
            holdSeconds: 75,
            bilateral: false,
            cue: 'Hold doorframe or elevate heels slightly if tight; pry knees open gently with elbows.',
          },
        ],
      },
    ],
  },
  {
    id: 'stretch-forearms',
    domainId: 'stretching',
    title: 'Guitar & Climber Forearms, Wrists & Thoracic',
    track: 'forearms_thoracic',
    level: 'beginner',
    targetMinutes: 18,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Essential hygiene for heavy guitar + bouldering + laptop days: decompresses flexor tendons and hunched shoulders.',
    phases: [
      {
        id: 'sf-p1',
        title: 'Guided Upper-Chain & Forearm Sequence',
        minutes: 18,
        instruction:
          'Breathe slowly through every hold. Forearm stretches should feel smoothly lengthening, never tingly or numb.',
        toolHint: 'stretch_guide',
        stretchPoses: [
          {
            id: 'pose-flexor',
            name: 'Tabletop Wrist Flexor Rock',
            target: 'Forearm Flexors & Carpal Tunnel',
            holdSeconds: 60,
            bilateral: false,
            cue: 'On all fours, turn fingers gently toward knees and lean hips back slightly until forearms feel an even stretch.',
          },
          {
            id: 'pose-extensor',
            name: 'Gentle Wrist Extensor Stretch',
            target: 'Outer Forearm & Tennis-Elbow Prevention',
            holdSeconds: 45,
            bilateral: true,
            cue: 'Arm straight out, palm facing down/back, lightly press back of hand toward wrist with zero force.',
          },
          {
            id: 'pose-finger-open',
            name: 'Reverse Prayer & Finger Splay',
            target: 'Finger Flexor Tendons & Palms',
            holdSeconds: 60,
            bilateral: false,
            cue: 'Press palms together at chest, lower hands slowly keeping heel of palms touching, then actively splay fingers wide.',
          },
          {
            id: 'pose-thoracic',
            name: 'Open-Book Thoracic Rotation',
            target: 'Mid-Back & Ribcage Mobility',
            holdSeconds: 50,
            bilateral: true,
            cue: 'Lie on side with top knee pinned to floor/foam roller; open top arm smoothly behind you tracking with eyes.',
          },
          {
            id: 'pose-pec',
            name: 'Corner / Floor Snow-Angel Pec Opener',
            target: 'Pectorals & Anterior Shoulders',
            holdSeconds: 60,
            bilateral: false,
            cue: 'Lie face-up over a rolled towel along spine, arms out in Y/W goal-post resting heavy toward floor.',
          },
        ],
      },
    ],
  },
  {
    id: 'stretch-decompress',
    domainId: 'stretching',
    title: 'Full-Body Parasympathetic Decompression',
    track: 'full_decompress',
    level: 'beginner',
    targetMinutes: 16,
    intensity: 'low',
    fingerLoad: 0,
    methodologyNote:
      'Pairs gentle whole-body traction with extended exhales to shift cleanly into restorative sleep.',
    phases: [
      {
        id: 'sd-p1',
        title: 'Guided Evening Decompression',
        minutes: 16,
        instruction:
          '4-second inhale, 7-second slow exhale throughout. Let gravity do all the work.',
        toolHint: 'stretch_guide',
        stretchPoses: [
          {
            id: 'pose-child',
            name: 'Extended Child’s Pose (Side Reach)',
            target: 'Lats, Shoulders & Lower Back',
            holdSeconds: 60,
            bilateral: true,
            cue: 'Sink hips to heels, walk hands 30° left then right to open lats along each side.',
          },
          {
            id: 'pose-pigeon',
            name: 'Reclined Figure-4 Glute Stretch',
            target: 'Piriformis & Outer Hip',
            holdSeconds: 55,
            bilateral: true,
            cue: 'On your back, cross ankle over opposite knee, draw thigh gently toward chest keeping head relaxed.',
          },
          {
            id: 'pose-twist',
            name: 'Supine Spinal Twist',
            target: 'Lumbar Spine & Obliques',
            holdSeconds: 50,
            bilateral: true,
            cue: 'Drop bent knee across body while anchoring opposite shoulder blade heavy on floor.',
          },
          {
            id: 'pose-neck',
            name: 'Seated Upper-Trap & Neck Release',
            target: 'Neck & Scalenes (Guitar/Laptop Tension)',
            holdSeconds: 45,
            bilateral: true,
            cue: 'Sit on one hand, gently tilt opposite ear toward shoulder—no pulling.',
          },
          {
            id: 'pose-legs-wall',
            name: 'Legs-Up-the-Wall Reset',
            target: 'Venous Recovery & Nervous System Downshift',
            holdSeconds: 90,
            bilateral: false,
            cue: 'Rest calves/heels up a wall or sofa, hands on belly, lengthening every exhale.',
          },
        ],
      },
    ],
  },
];

export const DEFAULT_WEEKLY_TEMPLATE: WeeklyDayTemplate[] = [
  { weekday: 0, isBoulderingDay: false, boulderingFocus: 'volume', focusNote: 'Active recovery & deep creative flow' },
  { weekday: 1, isBoulderingDay: true, boulderingFocus: 'limit', focusNote: 'Fresh nervous system: Limit projecting' },
  { weekday: 2, isBoulderingDay: false, boulderingFocus: 'volume', focusNote: 'Skill & venture consolidation' },
  { weekday: 3, isBoulderingDay: true, boulderingFocus: 'volume', focusNote: 'Precision volume & silent feet' },
  { weekday: 4, isBoulderingDay: false, boulderingFocus: 'capacity', focusNote: 'Deep craft & tendon recovery' },
  { weekday: 5, isBoulderingDay: true, boulderingFocus: 'capacity', focusNote: 'Anti-style & capacity work' },
  { weekday: 6, isBoulderingDay: false, boulderingFocus: 'volume', focusNote: 'Longer creative output & reset' },
];

export const DEFAULT_ENTREPRENEUR_TASKS: EntrepreneurTask[] = [
  {
    id: 'ent-task-1',
    title: 'Define this week’s #1 product bottleneck & ship a concrete fix',
    category: 'build',
    venture: 'Primary Venture',
    done: false,
    isDominoToday: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent-task-2',
    title: 'Reach out to 3 real users or publish 1 distribution post',
    category: 'distribution',
    venture: 'Primary Venture',
    done: false,
    isDominoToday: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent-task-3',
    title: 'Review unit economics & cut lowest-leverage tasks for the week',
    category: 'strategy',
    venture: 'Primary Venture',
    done: false,
    isDominoToday: false,
    createdAt: new Date().toISOString(),
  },
];

export function getTemplatesForDomain(
  domainId: DomainId,
  customDrills: SessionTemplate[] = []
): SessionTemplate[] {
  return [
    ...SESSION_TEMPLATES.filter((t) => t.domainId === domainId),
    ...customDrills.filter((t) => t.domainId === domainId),
  ];
}

export function getTemplateById(
  templateId: string,
  customDrills: SessionTemplate[] = []
): SessionTemplate | undefined {
  return (
    SESSION_TEMPLATES.find((t) => t.id === templateId) ||
    customDrills.find((t) => t.id === templateId)
  );
}
