/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimpleExplanation {
  original: string;
  simple: string;
  description: string;
}

export interface SummaryResult {
  title: string;
  originalText: string;
  summaryPoints: string[];
  simpleExplanations: SimpleExplanation[];
  spokenSummary: string;
}

export interface UserAccount {
  id: string; // login ID
  name: string; // Display name
  password: string; // password
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  userId: string; // associated user ID
  timestamp: number;
  formattedDate: string;
  type: "conversation" | "scanner";
  result: SummaryResult;
}

export type ActiveScreen = "home" | "conversation" | "scanner" | "history" | "login";
