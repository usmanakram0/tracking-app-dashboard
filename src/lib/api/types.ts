export const DELETE_RESOURCES = [
  'notifications',
  'contacts',
  'locations',
  'sms',
  'gallery',
  'audio',
] as const;

export type DeleteResource = (typeof DELETE_RESOURCES)[number];

export type DeleteItemsResponse = {
  deleted: number;
};
