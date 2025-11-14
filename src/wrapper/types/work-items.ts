export type WorkItemType = 'Task' | 'Bug' | 'User Story' | 'Epic' | 'Feature' | 'Issue';

export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';

export interface WorkItemFields {
  'System.Id'?: number;
  'System.Title'?: string;
  'System.Description'?: string;
  'System.State'?: WorkItemState;
  'System.AssignedTo'?: string;
  'System.AreaPath'?: string;
  'System.IterationPath'?: string;
  'System.Tags'?: string;
  'System.WorkItemType'?: WorkItemType;
  'System.CreatedDate'?: string;
  'System.ChangedDate'?: string;
  'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
  'Microsoft.VSTS.Scheduling.Effort'?: number;
  'Microsoft.VSTS.Scheduling.Remaining Work'?: number;
  'Microsoft.VSTS.Common.Priority'?: number;
  'Microsoft.VSTS.Common.Severity'?: string;
  'Microsoft.VSTS.Common.AcceptanceCriteria'?: string;
  'Microsoft.VSTS.TCM.ReproSteps'?: string;
  [key: string]: unknown;
}

export interface WorkItem {
  id: number;
  rev: number;
  fields: WorkItemFields;
  url: string;
}

export type JsonPatchOperation =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'replace'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'test'; path: string; value: unknown }
  | { op: 'move'; from: string; path: string }
  | { op: 'copy'; from: string; path: string };

export interface CreateWorkItemPayload {
  type: WorkItemType;
  fields: Partial<WorkItemFields>;
}

export interface UpdateWorkItemPayload {
  operations: JsonPatchOperation[];
}

export type WorkItemRelationType = 'parent' | 'related' | 'predecessor' | 'successor';

export interface AddWorkItemRelationPayload {
  workItemId: number;
  targetWorkItemId: number;
  relationType: WorkItemRelationType;
  comment?: string;
}

