export interface ProjectReference {
  readonly id: string;
  readonly name: string;
  readonly url: string;
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  description?: string;
  readonly projectId?: string;
  readonly projectName?: string;
  identityUrl?: string;
}

export interface TeamMember {
  readonly identity: {
    readonly id: string;
    readonly displayName: string;
    readonly uniqueName: string;
    readonly imageUrl?: string;
  };
  readonly isTeamAdmin: boolean;
}

export interface TeamSettings {
  readonly backlogIteration?: {
    readonly id: string;
    readonly name: string;
  };
  readonly defaultIteration?: {
    readonly id: string;
    readonly name: string;
  };
  readonly backlogVisibilities?: Record<string, boolean>;
  readonly bugsBehavior?: string;
  readonly workingDays?: readonly string[];
}

export interface TeamFieldValues {
  readonly field: {
    readonly referenceName: string;
    readonly name: string;
  };
  readonly values: readonly {
    readonly value: string;
    readonly includeChildren: boolean;
  }[];
}

export interface CreateTeamPayload {
  readonly name: string;
  readonly description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface AddTeamMemberPayload {
  readonly userId: string;
}

export interface TeamsListResult {
  value: Team[];
  count: number;
}

export interface TeamMembersResult {
  value: TeamMember[];
  count: number;
}

