export interface AvatarDef {
  id: string;
  name: string;
  dataUri: string;
}

const NAMES = [
  'The Classic Pro', 'Neon Volley', 'The Grinder', 'Court Captain', 'Goggle Guru',
  'The Dink Specialist', 'Visor Veteran', 'Kitchen King', 'Rally Runner', 'Lob Legend',
  'Paddle Master', 'Banger Beast', 'Sideline Sage', 'The Shark', 'Spin Doctor',
  'Baseline Bomber', 'Reflex Rookie', 'Third Shot Drop', 'Overhead Ace', 'Match Point',
];

const SVGS: string[] = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#F3D2B3"/><path d="M18 45c0-12 10-22 22-22s22 10 22 22" fill="#4A90E2"/><rect x="15" y="42" width="50" height="6" rx="3" fill="#FFFFFF"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><path d="M20 50a20 20 0 0 1 40 0v10H20V50z" fill="#FFD700"/><circle cx="40" cy="40" r="18" fill="#E2F022"/><path d="M25 35h30v5H25z" fill="#333333"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#D4A373"/><path d="M20 35c0-10 9-18 20-18s20 8 20 18v10H20V35z" fill="#2D6A4F"/><rect x="18" y="32" width="44" height="8" rx="4" fill="#FFFFFF"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><path d="M22 55a18 18 0 0 1 36 0" stroke="#F4A261" stroke-width="32" fill="none"/><path d="M20 38h40l-5-15H25l-5 15z" fill="#E76F51"/><circle cx="30" cy="45" r="4" fill="#264653"/><circle cx="50" cy="45" r="4" fill="#264653"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#FFDBAC"/><path d="M18 45a22 22 0 0 1 44 0" fill="#B0C4DE"/><rect x="20" y="38" width="40" height="12" rx="6" fill="#333333"/><rect x="24" y="41" width="12" height="6" rx="2" fill="#87CEEB"/><rect x="44" y="41" width="12" height="6" rx="2" fill="#87CEEB"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="48" r="20" fill="#8D5524"/><path d="M20 48c0-11 9-20 20-20s20 9 20 20" fill="#E9C46A"/><path d="M15 28c5-10 45-10 50 0z" fill="#264653"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#F1C27D"/><path d="M20 40h40v10H20z" fill="#E63946"/><path d="M10 40c0-5 10-5 60 0v4H10z" fill="#E63946"/><rect x="25" y="45" width="30" height="2" fill="#F1FAEE"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><path d="M20 50a20 20 0 0 1 40 0H20z" fill="#A8DADC"/><circle cx="40" cy="35" r="15" fill="#457B9D"/><path d="M25 35h30" stroke="#F1FAEE" stroke-width="8" stroke-linecap="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#E0AC69"/><path d="M20 30h40v15H20z" fill="#606C38"/><path d="M18 45l22-25 22 25z" fill="#283618"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="21" fill="#FFDBAC"/><path d="M19 40c0-11 10-20 21-20s21 9 21 20H19z" fill="#F4A261"/><rect x="36" y="15" width="8" height="10" rx="2" fill="#2A9D8F"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#C68642"/><path d="M20 45a20 20 0 0 1 40 0" fill="#2B2D42"/><path d="M25 40l15-15 15 15z" fill="#8D99AE"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#F3D2B3"/><path d="M18 45v-5c0-12 10-22 22-22s22 10 22 22v5H18z" fill="#D90429"/><rect x="25" y="42" width="30" height="4" fill="#EDF2F4"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#FFDBAC"/><path d="M20 40a20 20 0 0 1 40 0H20z" fill="#FB8500"/><path d="M22 40l18-20 18 20z" fill="#023047"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#E0AC69"/><path d="M18 45a22 22 0 0 1 44 0" fill="#219EBC"/><rect x="20" y="42" width="40" height="8" rx="4" fill="#8ECAE6"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#D4A373"/><path d="M20 45c0-11 9-20 20-20s20 9 20 20v8H20v-8z" fill="#6A4C93"/><circle cx="40" cy="30" r="5" fill="#FFCA3A"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#F3D2B3"/><path d="M18 45a22 22 0 0 1 44 0" fill="#1982C4"/><path d="M25 35c0-5 10-10 15-10s15 5 15 10H25z" fill="#FF595E"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#FFDBAC"/><path d="M20 38h40v10H20z" fill="#8AC926"/><rect x="25" y="32" width="30" height="6" rx="3" fill="#1982C4"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="21" fill="#E0AC69"/><path d="M19 45a21 21 0 0 1 42 0" fill="#6A0DAD"/><path d="M30 30h20l-10 10z" fill="#B19CD9"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="22" fill="#F1C27D"/><path d="M18 45c0-12 10-22 22-22s22 10 22 22H18z" fill="#FF9200"/><rect x="20" y="42" width="40" height="5" fill="#FFFFFF"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" shape-rendering="geometricPrecision"><circle cx="40" cy="45" r="20" fill="#D4A373"/><path d="M20 40a20 20 0 0 1 40 0" fill="#007F5F"/><circle cx="40" cy="35" r="10" fill="#55A630"/></svg>',
];

export function generateAvatars(): AvatarDef[] {
  return SVGS.map((svg, i) => ({
    id: `avatar_${i}`,
    name: NAMES[i] || `Avatar ${i + 1}`,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  }));
}
