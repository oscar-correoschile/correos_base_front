export interface ParameterInterface {
  id: number;
  parentId: string | null;
  type: string;
  code: string;
  name: string;
  description: string | null;
  entity: string | null;
  isActive: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Relations
  parent?: ParameterInterface;
  children?: ParameterInterface[];

  // Computed properties
  isRoot: boolean;
  hasChildren: boolean;
}

export interface GenericInterface {
  name: string;
  value: string;
}

export interface CreateParameterInterface {
  type: string;
  code: string;
  name: string;
  description?: string;
  entity?: string;
  parentId?: string | null;
  isActive?: boolean;
  isVisible?: boolean;
}
