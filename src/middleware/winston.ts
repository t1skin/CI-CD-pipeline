import * as winston from 'winston';

interface Options {
  file: {
    level: string;
    filename: string;
    handleExceptions: boolean;
    maxsize: number;
    maxFiles: number;
    format: winston.Logform.Format;
  };
  console: {
    level: string;
    handleExceptions: boolean;
    format: winston.Logform.Format;
  };
}

const options: Options = {
  file: {
    level: 'info',
    filename: `./logs/app.log`,
    handleExceptions: true,
    maxsize: 5242880, // about 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  },
};

const baseLogger: winston.Logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

const logger = {
  ...baseLogger,
  stream: {
    write: (message: string): void => {
      baseLogger.info(message.trim());
    },
  },
};

export default logger;
