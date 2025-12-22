type HealthResponse = {
    status: string;
};
declare const getApiBaseUrl: (override?: string) => string;

export { type HealthResponse, getApiBaseUrl };
