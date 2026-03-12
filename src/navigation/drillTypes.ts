export type DrillEntity = 'displayCategory' | 'displayGroup' | 'productComponent' | 'productForSale';

export type DrillState = {
  entity: DrillEntity;
  code: string;
  parentCode?: string;
  openModal?: boolean; // default true
};