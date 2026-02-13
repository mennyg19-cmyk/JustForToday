declare module '@kingstinct/react-native-healthkit' {
  export function isHealthDataAvailable(): boolean;

  export function requestAuthorization(options: {
    toRead?: string[];
    toWrite?: string[];
  }): Promise<boolean>;

  interface StatisticsResult {
    sumQuantity?: { quantity: number };
    averageQuantity?: { quantity: number };
  }

  export function queryStatisticsForQuantity(
    identifier: string,
    aggregation: string[],
    options: {
      filter?: {
        date?: {
          startDate: Date;
          endDate: Date;
        };
      };
      unit: string;
    }
  ): Promise<StatisticsResult>;

  export function queryWorkoutSamples(options: {
    filter?: {
      date?: {
        startDate: Date;
        endDate: Date;
      };
    };
    limit?: number;
  }): Promise<any[]>;
}
