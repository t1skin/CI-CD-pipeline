import { createLogger, format, transports, Logger } from 'winston';

// Define the custom settings for each transport
const options = {
  file: {
    level: 'info',
    filename: './logs/app.log',
    handleExceptions: true,
    maxsize: 5242880, // about 5MB
    maxFiles: 5,
    format: format.combine(format.timestamp(), format.json()),
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    format: format.combine(format.colorize(), format.simple()),
  },
};

// Instantiate a new Winston Logger with the options defined above
const logger: Logger = createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false,
});

// Create a stream object with a 'write' function
export class LoggerStream {
  write(message: string): void {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  }
}

export default logger;
