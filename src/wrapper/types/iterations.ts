export type TimeFrame = 'past' | 'current' | 'future';

export interface IterationAttributes {
    readonly startDate: string;
    readonly finishDate: string;
    readonly timeFrame: TimeFrame;
}

export interface Iteration {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly url: string;
    attributes: IterationAttributes;
}

export interface TeamIteration extends Iteration {
    readonly teamId?: string;
}

export interface ActivityCapacity {
    readonly name: string;
    capacityPerDay: number;
}

export interface DayOff {
    readonly start: string;
    readonly end: string;
}

export interface IterationCapacity {
    readonly teamMemberId: string;
    readonly teamMemberDisplayName?: string;
    activities: readonly ActivityCapacity[];
    daysOff: readonly DayOff[];
}

export interface TeamDaysOff {
    daysOff: readonly DayOff[];
}

export interface IterationWorkItemReference {
    readonly id: number;
    readonly url: string;
}

export interface IterationWorkItems {
    readonly workItemRelations: readonly {
        readonly target: IterationWorkItemReference;
        readonly rel: string;
    }[];
    readonly url: string;
}

export interface CreateIterationPayload {
  readonly name: string;
  readonly path?: string;
  readonly startDate: string;
  readonly finishDate: string;
  attributes?: {
    readonly startDate: string;
    readonly finishDate: string;
  };
}

