
export interface EventInformation {
  identifier : string;
  authority?: string;
  originTimeUTC : number;
  latitudeDeg: number;
  longitudeDeg: number;
  depthKM: number;
  isReviewed: boolean;
  eventType: string;
  magnitude?: number;
  magnitudeType?: string;
};
