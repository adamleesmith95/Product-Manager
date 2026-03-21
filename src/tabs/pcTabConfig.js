import PC_GeneralTab from './productTables/productComponents/PC_GeneralTab';
import PC_AdditionalTab from './productTables/productComponents/PC_AdditionalTab';
import PC_TaxTab from './productTables/productComponents/PC_TaxTab';
import PC_ProfileTab from './productTables/productComponents/PC_ProfileTab';
import PC_OutputTab from './productTables/productComponents/PC_OutputTab';

export const PC_TABS = [
  { key: 'general', label: 'General', Component: PC_GeneralTab },
  { key: 'additional', label: 'Additional', Component: PC_AdditionalTab },
  { key: 'tax', label: 'Tax', Component: PC_TaxTab },
  { key: 'profile', label: 'Profile', Component: PC_ProfileTab },
  { key: 'output', label: 'Output', Component: PC_OutputTab },
];