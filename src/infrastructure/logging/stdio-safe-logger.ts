import type { LoggerService } from '@nestjs/common';

/**
 * stdioモード専用のロガー
 * MCPプロトコルがstdoutを専有するため、全ログをstderrへ出力する
 */
export class StdioSafeLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('LOG', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('ERROR', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('WARN', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('DEBUG', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('VERBOSE', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('FATAL', message, optionalParams);
  }

  private write(
    level: string,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const context = optionalParams.length
      ? ` [${String(optionalParams[optionalParams.length - 1])}]`
      : '';
    process.stderr.write(`[${level}]${context} ${String(message)}\n`);
  }
}
