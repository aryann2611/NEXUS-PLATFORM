export const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();
