import type {
  ConnectionStatus,
  GoalCadence,
  GoalStatus,
  PartnershipKind,
  PartnershipStatus,
} from "@prisma/client";

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: ConnectionStatus;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Partnership {
  id: string;
  initiatorId: string;
  partnerId: string;
  kind: PartnershipKind;
  status: PartnershipStatus;
  notes?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  partnerId?: string | null;
  partnershipId?: string | null;
  status: GoalStatus;
  cadence: GoalCadence;
  progress: number;
  targetDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyCheckIn {
  id: string;
  userId: string;
  partnerId?: string | null;
  goalId?: string | null;
  partnershipId?: string | null;
  checkInDate: Date;
  mood?: string | null;
  summary: string;
  wins?: string | null;
  blockers?: string | null;
  commitment?: string | null;
  progressScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  partnerId?: string | null;
  goalId?: string | null;
  partnershipId?: string | null;
  weekStartDate: Date;
  wins?: string | null;
  challenges?: string | null;
  lessonsLearned?: string | null;
  nextWeekPlan?: string | null;
  completionScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
