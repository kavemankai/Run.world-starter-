/** Source: Phone-of-thrones- e7ab545, v0.8.0. Times in seconds; distances in arena units. */
export interface Attack {
  label: string;
  damage: number;
  reach: number;
  arc: number;
  windup: number;
  active: number;
  recover: number;
  knockback: number;
  lunge: number;
  lockTime: number;
  minRange: number;
  maxRange: number;
  chainTo: number;
  guardCost: number;
  blockStun: boolean;
  breaksBareGuard: boolean;
}
function attack(
  label: string,
  damage: number,
  reach: number,
  arc: number,
  windup: number,
  active: number,
  recover: number,
  extra: Partial<Attack> = {},
): Attack {
  return {
    label,
    damage,
    reach,
    arc,
    windup,
    active,
    recover,
    knockback: 0,
    lunge: 0,
    lockTime: 0.25,
    minRange: 0,
    maxRange: 0,
    chainTo: -1,
    guardCost: 1,
    blockStun: true,
    breaksBareGuard: false,
    ...extra,
  };
}
export interface Weapon {
  id: string;
  name: string;
  description: string;
  light: Attack;
  heavy: Attack;
  move: number;
  extraDodges: number;
  recharge: number;
  oneHanded: boolean;
  parryStagger: number;
  heavyStagger: number;
  blockStun: number;
  attackMove: number;
  parryKill: boolean;
  color: string;
  length: number;
  thickness: number;
  dual: boolean;
}
function weapon(
  id: string,
  name: string,
  description: string,
  light: Attack,
  heavy: Attack,
  extra: Partial<Weapon> = {},
): Weapon {
  return {
    id,
    name,
    description,
    light,
    heavy,
    move: 1,
    extraDodges: 0,
    recharge: 1,
    oneHanded: true,
    parryStagger: 3,
    heavyStagger: 1,
    blockStun: 1.2,
    attackMove: 0,
    parryKill: false,
    color: "#e2edff",
    length: 22,
    thickness: 4,
    dual: false,
    ...extra,
  };
}
export const WEAPONS: Weapon[] = [
  weapon(
    "sword",
    "Sword",
    "Balanced cuts. A wide heavy swing pushes enemies away.",
    attack("Cut", 10, 75, 90, 0.1, 0.08, 0.22),
    attack("Cleave", 25, 95, 140, 0.15, 0.1, 0.4, { knockback: 35 }),
  ),
  weapon(
    "spear",
    "Spear",
    "Long, narrow thrusts. Heavy attacks lunge forward.",
    attack("Thrust", 10, 95, 30, 0.12, 0.08, 0.26),
    attack("Lunge", 22, 120, 24, 0.22, 0.1, 0.45, { lunge: 35 }),
    {
      parryStagger: 3.5,
      heavyStagger: 0.8,
      blockStun: 1.4,
      length: 46,
      thickness: 3,
      color: "#f2e6b3",
    },
  ),
  weapon(
    "axe",
    "Axe",
    "Slow, powerful swings. Heavy attacks sweep a wide arc.",
    attack("Chop", 16, 70, 150, 0.22, 0.1, 0.38),
    attack("Spin", 38, 90, 200, 0.35, 0.14, 0.6, { knockback: 60 }),
    {
      move: 0.9,
      recharge: 1.2,
      oneHanded: false,
      parryStagger: 2.5,
      heavyStagger: 1.5,
      blockStun: 1.6,
      length: 20,
      thickness: 8,
      color: "#d9bf8c",
    },
  ),
  weapon(
    "daggers",
    "Daggers",
    "Keep moving while striking in every direction. Parries execute grunts.",
    attack("Stab", 5, 40, 360, 0.04, 0.05, 0.09),
    attack("Whirl", 12, 50, 360, 0.08, 0.07, 0.18),
    {
      move: 1.1,
      extraDodges: 1,
      recharge: 0.8,
      oneHanded: false,
      parryStagger: 2,
      heavyStagger: 0.6,
      blockStun: 0.8,
      attackMove: 0.7,
      parryKill: true,
      length: 14,
      thickness: 3,
      dual: true,
      color: "#ccf2ff",
    },
  ),
  weapon(
    "zweihander",
    "Zweihander",
    "A two-handed greatsword. Long reach, wide arcs, deliberate strikes.",
    attack("Sweep", 14, 85, 100, 0.18, 0.08, 0.32),
    attack("Great cleave", 34, 105, 160, 0.28, 0.12, 0.5, { knockback: 45 }),
    {
      move: 0.95,
      recharge: 1.1,
      oneHanded: false,
      heavyStagger: 1.3,
      blockStun: 1.4,
      length: 40,
      thickness: 7,
      color: "#d1dbf2",
    },
  ),
];
export const T = {
  heroHp: 100,
  heroSpeed: 195,
  rampUp: 0.12,
  rampDown: 0.08,
  heroRadius: 16,
  halfSpeed: 0.5,
  aimCone: 90,
  heavyHold: 0.2,
  dodgeDistance: 90,
  dodgeDuration: 0.3,
  dodgeIframes: 0.16,
  dodgeCharges: 2,
  dodgeRecharge: 1.4,
  hurtDuration: 0.15,
  hitImmunity: 0.35,
  enemyGap: 0.35,
  enemyStrafe: 0.4,
  enemyStagger: 0.6,
  maxCommits: 2,
  separation: 300,
  blockMove: 0.4,
  shieldMove: 0.95,
  shieldArc: 360,
  bareArc: 360,
  shieldReduction: 1,
  bareReduction: 0.6,
  shieldGuard: 80,
  bareGuard: 40,
  shieldCost: 1,
  bareCost: 1.5,
  guardRegen: 25,
  guardDelay: 0.6,
  guardBreak: 0.8,
  guardRefill: 0.5,
  shieldParry: 0.4,
  bareParry: 0.32,
  blockDelay: 0.35,
  staggerBonus: 2,
  staggerImmunity: 1,
  captainIntro: 2,
  captainHeal: 30,
  resultDelay: 0.6,
} as const;
export interface Profile {
  id: "grunt" | "captain";
  hp: number;
  speed: number;
  radius: number;
  hover: number;
  heavyStagger: number;
  executeFraction: number;
  attacks: Attack[];
  pattern: number[];
}
export const GRUNT: Profile = {
  id: "grunt",
  hp: 30,
  speed: 105,
  radius: 16,
  hover: 90,
  heavyStagger: 1,
  executeFraction: 1,
  attacks: [attack("Strike", 12, 48, 100, 0.65, 0.1, 0.65, { maxRange: 52 })],
  pattern: [0],
};
export const CAPTAIN: Profile = {
  id: "captain",
  hp: 150,
  speed: 95,
  radius: 22,
  hover: 100,
  heavyStagger: 0.5,
  executeFraction: 0.4,
  attacks: [
    attack("Slash", 18, 62, 120, 0.7, 0.1, 0.6, { maxRange: 62 }),
    attack("Combo I", 14, 58, 110, 0.55, 0.1, 0.12, {
      maxRange: 62,
      chainTo: 2,
    }),
    attack("Combo II", 20, 66, 130, 0.38, 0.1, 0.8, { lockTime: 0.18 }),
    attack("Lunge", 22, 150, 28, 0.8, 0.12, 0.9, {
      lunge: 120,
      lockTime: 0.3,
      minRange: 105,
      maxRange: 140,
      guardCost: 2,
      blockStun: false,
      breaksBareGuard: true,
    }),
  ],
  pattern: [3, 0, 1, 0, 1],
};
export type Sound =
  | "light"
  | "heavy"
  | "hit"
  | "hurt"
  | "dodge"
  | "parry"
  | "block"
  | "break"
  | "strike"
  | "captain"
  | "win"
  | "lose";
