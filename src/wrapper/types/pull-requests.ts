export type PullRequestStatus = 'active' | 'completed' | 'abandoned' | 'notSet';

export type PullRequestMergeStatus = 'queued' | 'conflicts' | 'succeeded' | 'rejectedByPolicy' | 'failure';

export type PullRequestVote = -10 | -5 | 0 | 5 | 10;

export interface GitRepository {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly project?: {
    readonly id: string;
    readonly name: string;
  };
  readonly defaultBranch?: string;
  readonly size?: number;
  readonly remoteUrl?: string;
  readonly sshUrl?: string;
  readonly webUrl?: string;
}

export interface RepositoriesListResult {
  value: GitRepository[];
  count: number;
}

export interface IdentityRef {
  readonly id: string;
  readonly displayName: string;
  readonly uniqueName?: string;
  readonly imageUrl?: string;
}

export interface PullRequestReviewer extends IdentityRef {
  vote: PullRequestVote;
  readonly isRequired?: boolean;
  readonly isFlagged?: boolean;
}

export interface GitRef {
  readonly name: string;
  readonly objectId: string;
}

export interface PullRequest {
  readonly pullRequestId: number;
  readonly repositoryId: string;
  readonly repository?: GitRepository;
  title: string;
  description?: string;
  readonly sourceRefName: string;
  readonly targetRefName: string;
  status: PullRequestStatus;
  readonly createdBy: IdentityRef;
  readonly creationDate: string;
  readonly mergeStatus?: PullRequestMergeStatus;
  readonly url: string;
  reviewers?: readonly PullRequestReviewer[];
  readonly isDraft?: boolean;
  readonly supportsIterations?: boolean;
}

export interface PullRequestThread {
  readonly id: number;
  readonly pullRequestThreadContext?: {
    readonly iterationContext?: {
      readonly firstComparingIteration: number;
      readonly secondComparingIteration: number;
    };
    readonly trackingCriteria?: unknown;
  };
  comments?: readonly PullRequestComment[];
  readonly status?: 'active' | 'fixed' | 'wontFix' | 'closed' | 'byDesign' | 'pending';
  readonly threadContext?: unknown;
  readonly properties?: Record<string, unknown>;
}

export interface PullRequestComment {
  readonly id: number;
  readonly parentCommentId?: number;
  content: string;
  readonly author: IdentityRef;
  readonly publishedDate: string;
  readonly lastUpdatedDate?: string;
  readonly commentType?: 'text' | 'codeChange' | 'system';
}

export interface CreatePullRequestPayload {
  readonly sourceRefName: string;
  readonly targetRefName: string;
  readonly title: string;
  readonly description?: string;
  readonly reviewers?: readonly { id: string }[];
  readonly isDraft?: boolean;
}

export interface UpdatePullRequestPayload {
  title?: string;
  description?: string;
  status?: PullRequestStatus;
  readonly autoCompleteSetBy?: {
    id: string;
  };
  readonly completionOptions?: {
    readonly deleteSourceBranch?: boolean;
    readonly mergeCommitMessage?: string;
    readonly squashMerge?: boolean;
  };
}

export interface MergePullRequestPayload {
  readonly lastMergeSourceCommit: {
    readonly commitId: string;
  };
  readonly completionOptions?: {
    readonly deleteSourceBranch?: boolean;
    readonly mergeCommitMessage?: string;
    readonly squashMerge?: boolean;
  };
}

export interface AddCommentPayload {
  readonly content: string;
  readonly parentCommentId?: number;
}

export interface AddReviewerPayload {
  readonly id: string;
  readonly isRequired?: boolean;
}

export interface PullRequestVotePayload {
  readonly vote: PullRequestVote;
}

export interface PullRequestListResult {
  value: PullRequest[];
  count: number;
}

