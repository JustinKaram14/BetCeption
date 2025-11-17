type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogPayload = Record<string, unknown>;

const normalize = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }
  return value;
};

function serialize(level: LogLevel, message: string, payload: LogPayload = {}) {
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalize(value)]),
  );
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...normalizedPayload,
  });
}

export const logger = {
  info(message: string, payload?: LogPayload) {
    console.log(serialize('info', message, payload));
  },
  warn(message: string, payload?: LogPayload) {
    console.warn(serialize('warn', message, payload));
  },
  error(message: string, payload?: LogPayload) {
    console.error(serialize('error', message, payload));
  },
  debug(message: string, payload?: LogPayload) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(serialize('debug', message, payload));
  },
};
