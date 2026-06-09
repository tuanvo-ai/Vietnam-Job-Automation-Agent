export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  source: "vietnamworks" | "topcv" | "careerbuilder" | "itviec" | "custom" | string;
  originalKeywords: string[];
  dateScraped: string;
  status: "Scraped" | "Analyzing" | "Analyzed" | "Applying" | "Applied";
  description: string;
  fitScore?: number;
  fitReason?: string;
  missingKeywords?: string[];
  coverLetter?: string;
  dateApplied?: string;
}

export interface VjaaConfig {
  keywords: string[];
  location: string;
  platforms: {
    vietnamworks: boolean;
    topcv: boolean;
    linkedin: boolean;
    careerbuilder: boolean;
    itviec: boolean;
  };
  antiBotConfig: {
    humanDelayMin: number;
    humanDelayMax: number;
    userAgentSpoofing: boolean;
    semiAutonomous: boolean;
  };
}

export interface SessionState {
  loggedIn: boolean;
  lastLogin: string | null;
  username: string;
  cookiesCount: number;
  localStorageKeys: string[];
  sessionFile: string;
}

export interface LogLine {
  text: string;
  timestamp: string;
  percent: number;
  type: "info" | "success" | "warn" | "log";
}
