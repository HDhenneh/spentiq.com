export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Passage {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  wordCount: number;
  quiz: QuizQuestion[];
}

export const passages: Passage[] = [
  {
    id: 'passage-1',
    title: 'The Benefits of Regular Exercise',
    difficulty: 'easy',
    content: `Regular physical activity is one of the most important things you can do for your health. Being physically active can improve your brain health, help manage weight, reduce the risk of disease, strengthen bones and muscles, and improve your ability to do everyday activities. Adults who sit less and do any amount of moderate-to-vigorous physical activity gain some health benefits. Even small amounts of physical activity are helpful, and accumulated activity throughout the day adds up to provide health benefits. Aim for at least 150 minutes a week of moderate-intensity activity, or 75 minutes a week of vigorous-intensity activity. Muscle-strengthening activities should also be included on 2 or more days a week. Remember, some physical activity is better than none.`,
    wordCount: 130,
    quiz: [
      {
        question: 'What is one benefit of regular physical activity mentioned in the text?',
        options: ['Improved social skills', 'Strengthened bones and muscles', 'Increased appetite', 'Better sleep quality'],
        correctAnswer: 'Strengthened bones and muscles',
      },
      {
        question: 'What is the minimum recommended amount of moderate-intensity activity per week?',
        options: ['75 minutes', '100 minutes', '150 minutes', '200 minutes'],
        correctAnswer: '150 minutes',
      },
      {
          question: 'How many days per week should muscle-strengthening activities be included?',
          options: ['1 day', '2 or more days', '5 days', 'Every day'],
          correctAnswer: '2 or more days',
      },
      {
        question: 'According to the text, is it better to do some physical activity or none at all?',
        options: ['It depends on the type of activity', 'None is better if you are busy', 'Some activity is better than none', 'The text does not specify'],
        correctAnswer: 'Some activity is better than none',
      },
    ],
  },
  {
    id: 'passage-2',
    title: 'The History of the Internet',
    difficulty: 'medium',
    content: `The internet's origins can be traced back to the 1960s as a way for government researchers to share information. Computers in the '60s were large and immobile and, in order to make use of information stored in any one computer, one had to either travel to the site of the computer or have magnetic computer tapes sent through the conventional postal system. Another catalyst in the formation of the internet was the heating up of the Cold War. The Soviet Union's launch of the Sputnik satellite spurred the U.S. Defense Department to consider ways information could still be disseminated even after a nuclear attack. This eventually led to the formation of the ARPANET (Advanced Research Projects Agency Network), the network that ultimately evolved into what we now know as the internet. ARPANET was a great success but membership was limited to certain academic and research organizations who had contracts with the Defense Department. In response to this, other networks were created to provide information sharing. The internet as we know it today began to take shape in the 1980s and gained public popularity in the early 1990s with the development of the World Wide Web by Tim Berners-Lee.`,
    wordCount: 218,
    quiz: [
      {
        question: 'When did the origins of the internet begin?',
        options: ['1950s', '1960s', '1970s', '1980s'],
        correctAnswer: '1960s',
      },
      {
        question: 'What event spurred the U.S. Defense Department to consider robust information dissemination methods?',
        options: ['The invention of the transistor', 'The Vietnam War', "The Soviet Union's launch of Sputnik", 'The development of personal computers'],
        correctAnswer: "The Soviet Union's launch of Sputnik",
      },
      {
        question: 'What does ARPANET stand for?',
        options: ['Advanced Research Projects Agency Network', 'American Regional Protection Agency Network', 'Associated Resource Planning Agency Network', 'Automated Research Programming Network'],
        correctAnswer: 'Advanced Research Projects Agency Network',
      },
      {
          question: 'Who developed the World Wide Web, leading to the internet\'s public popularity?',
          options: ['Bill Gates', 'Steve Jobs', 'Vint Cerf', 'Tim Berners-Lee'],
          correctAnswer: 'Tim Berners-Lee',
      },
        {
          question: 'Why were other networks created besides ARPANET?',
          options: ['ARPANET was too slow', 'ARPANET membership was limited', 'ARPANET was only for military use', 'ARPANET was expensive'],
          correctAnswer: 'ARPANET membership was limited',
        },
    ],
  },
    {
      id: 'passage-3',
      title: 'The Science of Sleep',
      difficulty: 'hard',
      content: `Sleep is a fundamental biological process, crucial for cognitive function, emotional regulation, and physical health. Despite its ubiquity, the precise mechanisms governing sleep and its diverse functions remain subjects of intensive research. Sleep architecture is characterized by cycles of rapid eye movement (REM) and non-rapid eye movement (NREM) sleep. NREM sleep is further subdivided into stages N1, N2, and N3, representing progressively deeper sleep. Stage N3, often termed slow-wave sleep (SWS), is considered the most restorative phase, critical for physiological recovery and memory consolidation. REM sleep, conversely, is associated with vivid dreaming, heightened brain activity resembling wakefulness, and plays a role in emotional processing and synaptic plasticity. The regulation of sleep-wake cycles involves a complex interplay between two primary systems: the circadian rhythm and sleep homeostasis. The circadian rhythm, governed by the suprachiasmatic nucleus (SCN) in the hypothalamus, dictates a roughly 24-hour cycle influenced by external cues like light. Sleep homeostasis, on the other hand, tracks the duration of wakefulness, increasing the pressure to sleep the longer one stays awake. Disruptions to these systems, whether through lifestyle factors, medical conditions, or environmental changes, can lead to sleep disorders and significant health consequences, impacting everything from metabolic function to immune response and mental well-being. Understanding these intricate processes is vital for developing effective strategies to mitigate sleep disturbances and promote optimal health.`,
      wordCount: 249,
      quiz: [
        {
          question: 'What are the two main types of sleep mentioned?',
          options: ['Light Sleep and Deep Sleep', 'REM and NREM Sleep', 'Alpha Sleep and Beta Sleep', 'Restful Sleep and Active Sleep'],
          correctAnswer: 'REM and NREM Sleep',
        },
        {
          question: 'Which stage of NREM sleep is considered the most restorative?',
          options: ['N1', 'N2', 'N3 (Slow-Wave Sleep)', 'N4'],
          correctAnswer: 'N3 (Slow-Wave Sleep)',
        },
        {
          question: 'What is REM sleep primarily associated with?',
          options: ['Muscle paralysis', 'Slow brain waves', 'Vivid dreaming and heightened brain activity', 'Physiological recovery'],
          correctAnswer: 'Vivid dreaming and heightened brain activity',
        },
        {
          question: 'Which brain structure governs the circadian rhythm?',
          options: ['Amygdala', 'Hippocampus', 'Pineal Gland', 'Suprachiasmatic Nucleus (SCN)'],
          correctAnswer: 'Suprachiasmatic Nucleus (SCN)',
        },
         {
           question: 'What is the term for the system that increases the pressure to sleep based on wakefulness duration?',
           options: ['Circadian Rhythm', 'Sleep Homeostasis', 'Synaptic Plasticity', 'Sleep Architecture'],
           correctAnswer: 'Sleep Homeostasis',
         },
      ],
    },
];

export function getPassageById(id: string): Passage | undefined {
  return passages.find(p => p.id === id);
}

export function getRandomPassage(difficulty?: 'easy' | 'medium' | 'hard'): Passage {
    const filteredPassages = difficulty ? passages.filter(p => p.difficulty === difficulty) : passages;
    const randomIndex = Math.floor(Math.random() * filteredPassages.length);
    return filteredPassages[randomIndex];
}
