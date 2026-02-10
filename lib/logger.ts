/**
 * Thin logging wrapper that silences output in production builds.
 *
 * In development (__DEV__ === true), calls pass straight through to console.
 * In production, all calls are no-ops to avoid leaking internal info.
 */

/* eslint-disable no-console */
export const logger = {
  info: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error(...args);
  },
};
