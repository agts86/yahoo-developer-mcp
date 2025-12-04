import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { McpService } from '../../application/mcp/mcp.service.js';

/**
 * SSE (Server-Sent Events) インターセプター
 * C# ASP.NET CoreのActionFilterに相当
 * Accept: text/event-streamヘッダーを検出してSSE処理を実行
 */
@Injectable()
export class SSEInterceptor implements NestInterceptor {
  /**
   * SSEInterceptorのインスタンスを作成します
   * @param mcpService - MCPサービス
   */
  constructor(private readonly mcpService: McpService) {}

  /**
   * リクエストをインターセプトし、SSE処理が必要かどうかを判定します
   * @param context - 実行コンテキスト
   * @param next - 次のハンドラー
   * @returns Observable、Promise、またはSSE処理結果
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    
    // SSEリクエストを検出
    if (request.headers.accept?.includes('text/event-stream')) {
      // SSE処理を実行してリクエストを終了
      this.mcpService.handleSSEConnection(reply, request);
      // Nest内部のlastValueFromでEmptyErrorにならないよう、ダミー値を返す
      return of(reply);
    }
    
    // 通常のリクエスト処理を続行
    return next.handle();
  }
}
