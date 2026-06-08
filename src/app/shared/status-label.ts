import { ActivityType, BrokerClientStatus, BuildingCategory, BuyerPurpose, DeliveryStatus, FinishingStatus, LeadSource, LeadStatus, NileSide, PaymentPlan, ProjectStatus, TaskPriority, TaskStatus, UnitDistrict, UnitStatus, UnitType } from '../core/models';

export type StatusLike = LeadStatus | LeadSource | BuyerPurpose | BrokerClientStatus | ActivityType | ProjectStatus | UnitStatus | UnitType | NileSide | UnitDistrict | FinishingStatus | PaymentPlan | BuildingCategory | DeliveryStatus | TaskStatus | TaskPriority;

export function labelKey(prefix: string, value: StatusLike | string | null | undefined): string {
  return value ? `${prefix}.${value}` : 'common.none';
}
