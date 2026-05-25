import { isProduction } from "../config/env";

const getErrorPayload = (error) =>
  error?.response?.data || error?.message || error;

const logger = {
  error: (...args) => {
    if (!isProduction) console.error(...args.map(getErrorPayload));
  },
  warn: (...args) => {
    if (!isProduction) console.warn(...args.map(getErrorPayload));
  },
  info: (...args) => {
    if (!isProduction) console.info(...args);
  },
};

export default logger;