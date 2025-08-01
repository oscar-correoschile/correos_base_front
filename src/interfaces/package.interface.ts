export interface PackageInterface {
  id: number;
  barCode: string;
  code: string;
  isActive: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  packageStatusId: number;
  packageTypeId: number;
  packageStatus: {
    id: number;
    type: string;
    name: string;
    description?: string;
  };
  packageType: {
    id: number;
    type: string;
    name: string;
    description?: string;
  };
  pallets: {
    id: number;
    code: string;
    number: string;
    isActive: boolean;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
  }[];
}
