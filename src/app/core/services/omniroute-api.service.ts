import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { SettingsService } from './settings.service';
import { ChatCompletionRequest, StreamEvent, ApiError, ModelParams, ChatMessage } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class OmniRouteApiService {
  private settingsService = inject(SettingsService);
  private ngZone = inject(NgZone);
  private abortController: AbortController | null = null;

  streamChatCompletion(
    messages: ChatMessage[],
    model: string,
    params: ModelParams
  ): Observable<StreamEvent> {
    return new Observable<StreamEvent>((subscriber) => {
      const settings = this.settingsService.settings();
      this.abortController = new AbortController();

      const requestBody: ChatCompletionRequest = {
        model,
        messages,
        stream: false, // OmniRoute works best with non-streaming (matches reference app)
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
      };

      this.performRequest(
        `${settings.apiBaseUrl}/chat/completions`,
        settings.apiKey,
        requestBody,
        model,
        subscriber
      );

      return () => {
        this.abortController?.abort();
        this.abortController = null;
      };
    });
  }

  stopGeneration(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private emit(subscriber: Subscriber<StreamEvent>, event: StreamEvent): void {
    this.ngZone.run(() => subscriber.next(event));
  }

  private async performRequest(
    url: string,
    apiKey: string,
    body: ChatCompletionRequest,
    model: string,
    subscriber: Subscriber<StreamEvent>
  ): Promise<void> {
    try {
      const startTime = performance.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[OmniRoute] HTTP Error:', response.status, errorBody);
        this.ngZone.run(() => subscriber.error(new ApiError(response.status, errorBody)));
        return;
      }

      const contentType = response.headers.get('content-type') || '';

      // ── SSE Streaming (if server returns text/event-stream) ─────
      if (contentType.includes('text/event-stream')) {
        await this.handleSSEStream(response, model, startTime, subscriber);
        return;
      }

      // ── Standard JSON response (default mode) ──────────────────
      const json = await response.json();
      const latencyMs = Math.round(performance.now() - startTime);

      const content =
        json.choices?.[0]?.message?.content ??
        json.choices?.[0]?.delta?.content ??
        json.choices?.[0]?.text ??
        '';

      if (content) {
        // Simulate streaming by emitting the content in small chunks
        // This gives the user a nice typing animation effect
        await this.simulateStreaming(content, subscriber);
      }

      if (json.usage) {
        this.emit(subscriber, {
          type: 'usage',
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0,
          model: json.model || model,
        });
      }

      this.emit(subscriber, { type: 'done', latencyMs });
      this.ngZone.run(() => subscriber.complete());

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.ngZone.run(() => {
          subscriber.next({ type: 'aborted' });
          subscriber.complete();
        });
      } else {
        console.error('[OmniRoute] Request error:', error);
        this.ngZone.run(() => subscriber.error(new ApiError(0, error?.message || 'Network error')));
      }
    }
  }

  /**
   * Simulate streaming by emitting content word-by-word.
   * Creates a smooth typing animation from a non-streaming response.
   */
  private async simulateStreaming(
    content: string,
    subscriber: Subscriber<StreamEvent>
  ): Promise<void> {
    // Split content into small chunks (word boundaries + punctuation)
    const chunks: string[] = [];
    let current = '';

    for (let i = 0; i < content.length; i++) {
      current += content[i];

      // Emit at word boundaries, newlines, or every ~3-6 chars for code
      const isWordBreak = content[i] === ' ' || content[i] === '\n';
      const isPunctuation = '.,:;!?)>}'.includes(content[i]);
      const isLongRun = current.length >= 6;

      if (isWordBreak || isPunctuation || isLongRun) {
        chunks.push(current);
        current = '';
      }
    }
    if (current) chunks.push(current);

    // Emit chunks with tiny delays for typing effect
    for (const chunk of chunks) {
      this.emit(subscriber, { type: 'token', content: chunk });
      // Small delay between chunks for visual effect (5-15ms per chunk)
      await new Promise(resolve => setTimeout(resolve, 8));
    }
  }

  /**
   * Handle real SSE streaming response (if OmniRoute supports it).
   */
  private async handleSSEStream(
    response: Response,
    model: string,
    startTime: number,
    subscriber: Subscriber<StreamEvent>
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]' || trimmed === 'data:[DONE]') {
          this.emit(subscriber, { type: 'done', latencyMs: Math.round(performance.now() - startTime) });
          this.ngZone.run(() => subscriber.complete());
          return;
        }

        if (trimmed.startsWith('data:')) {
          const jsonStr = (trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5)).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text;
            if (content != null && content !== '') {
              this.emit(subscriber, { type: 'token', content });
            }
            if (json.usage) {
              this.emit(subscriber, {
                type: 'usage',
                promptTokens: json.usage.prompt_tokens ?? 0,
                completionTokens: json.usage.completion_tokens ?? 0,
                totalTokens: json.usage.total_tokens ?? 0,
                model: json.model || model,
              });
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }

    this.emit(subscriber, { type: 'done', latencyMs: Math.round(performance.now() - startTime) });
    this.ngZone.run(() => subscriber.complete());
  }
}
