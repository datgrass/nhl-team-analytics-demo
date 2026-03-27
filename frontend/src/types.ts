export interface Skater {
  playerId: number;
  headshot: string;
  firstName: { default: string };
  lastName: { default: string };
  positionCode: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  powerPlayGoals: number;
  shorthandedGoals: number;
  gameWinningGoals: number;
  shots: number;
  shootingPctg: number;
  avgTimeOnIcePerGame: number;
  faceoffWinPctg: number;
}

export interface Goalie {
  playerId: number;
  headshot: string;
  firstName: { default: string };
  lastName: { default: string };
  gamesPlayed: number;
  wins: number;
  losses: number;
  goalsAgainstAverage: number;
  savePercentage: number;
  overtimeLosses: number;
  shutouts: number;
  timeOnIce: number;
}

export interface Game {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: string;
  awayTeam: {
    abbrev: string;
    logo: string;
    score?: number;
    placeName?: { default: string };
  };
  homeTeam: {
    abbrev: string;
    logo: string;
    score?: number;
    placeName?: { default: string };
  };
  gameOutcome?: {
    lastPeriodType: string;
  };
}

export interface StandingsTeam {
  teamAbbrev: { default: string };
  teamName: { default: string };
  teamLogo: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  goalFor: number;
  goalAgainst: number;
  goalDifferential: number;
  divisionSequence: number;
  conferenceSequence: number;
  divisionAbbrev: string;
  conferenceName: string;
  streakCode: string;
  streakCount: number;
  pointPctg: number;
  l10Wins: number;
  l10Losses: number;
  l10OtLosses: number;
}

export interface CapSeason {
  season: string;
  salary_cap: number;
  current_roster_annual_cap_hit: number;
  projected_cap_hit: number;
  projected_cap_space: number;
  current_cap_space: number;
  cap_hit_forwards: number;
  cap_hit_defence: number;
  cap_hit_goalies: number;
  roster_count: number;
  contracts: number;
  ltir: number;
}

export interface PlayByPlayEvent {
  eventId: number;
  typeDescKey: string;
  typeCode: number;
  timeInPeriod: string;
  timeRemaining: string;
  periodDescriptor: {
    number: number;
    periodType: string;
  };
  details?: {
    xCoord?: number;
    yCoord?: number;
    zoneCode?: string;
    shotType?: string;
    scoringPlayerId?: number;
    shootingPlayerId?: number;
    goalieInNetId?: number;
    assist1PlayerId?: number;
    assist2PlayerId?: number;
    hittingPlayerId?: number;
    hitteePlayerId?: number;
    committedByPlayerId?: number;
    drawnByPlayerId?: number;
    descKey?: string;
    duration?: number;
    reason?: string;
    eventOwnerTeamId?: number;
    highlightClipSharingUrl?: string;
    awayScore?: number;
    homeScore?: number;
  };
  situationCode?: string;
}

export interface ScoringGoal {
  timeInPeriod: string;
  teamAbbrev: string;
  strength: string;
  goalModifier: string;
  shotType: string;
  scorer: {
    playerId?: number;
    firstName: string;
    lastName: string;
    headshot: string;
  };
  assists: Array<{
    firstName: string;
    lastName: string;
    playerId?: number;
  }>;
  awayScore: number;
  homeScore: number;
  highlightUrl?: string;
}

export interface ScoringPeriod {
  periodNumber: number;
  periodType: string;
  goals: ScoringGoal[];
}

export interface ThreeStar {
  star: number;
  playerId?: number;
  firstName: string;
  lastName: string;
  teamAbbrev: string;
  position: string;
  headshot: string;
  goals: number;
  assists: number;
  points: number;
}

export interface GameSummary {
  scoring: ScoringPeriod[];
  threeStars: ThreeStar[];
  source: string;
}

export interface BoxScorePlayer {
  playerId?: number;
  name: string;
  sweaterNumber: number;
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  hits: number;
  shots: number;
  blockedShots: number;
  powerPlayGoals: number;
  shifts: number;
  faceoffWinPctg: number;
  toi: string;
  giveaways: number;
  takeaways: number;
  // Goalie fields
  saves?: number;
  shotsAgainst?: number;
  goalsAgainst?: number;
  savePctg?: number;
  decision?: string;
}

export interface BoxScoreTeam {
  abbrev: string;
  skaters: BoxScorePlayer[];
  goalies: BoxScorePlayer[];
}

export interface BoxScore {
  teams: BoxScoreTeam[];
  source: string;
}

export interface Contract {
  player_id: string;
  first_name: string;
  last_name: string;
  position: string;
  position_detail: string;
  jersey_number: string;
  nhl_games: number;
  current: Array<{
    contract_id: string;
    contract_type: string;
    length: number;
    value: string;
    signing_status: string;
    contract_end: string;
    expiry_status: string;
    years: Array<{
      season: string;
      cap_hit: string;
      aav: string;
      base_salary: string;
    }>;
  }>;
}
