// Leonida Trophy Atlas — static configuration: the roadmap stages, kind and
// grade labels, PSN point values, the demo seed for screenshots (?seed=demo)
// and the source links the guides cite.
export const TOTAL_TROPHIES = 55;

export const STORAGE_KEY = 'leonida-trophy-atlas-v1';

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KINDS = {
  platinum: 'Platinum',
  story: 'Story',
  completion: '100%',
  activity: 'Activities',
  stranger: 'Strangers',
  collectible: 'Collectibles',
  feat: 'Feats',
};

// The five-stage road to the platinum, built from PowerPyx's roadmap:
// story 60–80h, the 100% grind ~100h, strangers ~10h, feats ~5h, platinum.
export const STAGES = [
  {
    n: 1,
    title: 'Story first',
    time: '60–80 hours',
    blurb:
      'Play the five chapters, take optional missions as they appear, and scan vehicles and study animals on the way. Do the Chapter 1 meditation at Jason’s house — it is the only missable step in the whole list.',
  },
  {
    n: 2,
    title: 'The 100% grind',
    time: 'About 100 hours',
    blurb:
      'After the credits, the 100% checklist opens under Progress > Stats. It is closer to 60% true completion: 70 of 80 challenges, 300 stunts, ranges, races, robberies and collections — nothing on it is missable.',
  },
  {
    n: 3,
    title: 'Strangers & side quests',
    time: 'About 10 hours',
    blurb:
      'Finish the 8 Strangers & Freaks strands and the character questlines — Andy, Kenton, Billy, Randy, Tyrone, Bret and Cal. Every quest giver is still around after the story.',
  },
  {
    n: 4,
    title: 'Feats & cleanup',
    time: 'About 5 hours',
    blurb:
      'Partner escapes, heists, combat feats and the easter eggs — plus the three trophies nobody has cracked yet. Check the unconfirmed notes before grinding those.',
  },
  {
    n: 5,
    title: 'Platinum',
    time: '—',
    blurb:
      'Vice Got a Price! pops the moment the other 54 trophies are yours. No DLC, no online trophy, nothing left to do but admire it.',
  },
];

// Thirteen earned trophies the ?seed=demo link starts with, so screenshots
// show a guide part-way through the hunt.
export const DEMO_EARNED = [2, 3, 8, 16, 20, 21, 28, 33, 35, 37, 44, 46, 53];

export const SOURCE_URLS = {
  Exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  PSNProfiles: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  PowerPyx: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/',
  'GTA Zone': 'https://gta-zone.com/news/gta-6-trophies-achievements/',
};
