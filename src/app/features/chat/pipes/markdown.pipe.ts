import { Pipe, PipeTransform } from '@angular/core';
import { renderMarkdown } from '../../../shared/utils/markdown-renderer.util';

@Pipe({ name: 'markdown', standalone: true, pure: false })
export class MarkdownPipe implements PipeTransform {
  transform(value: string): string {
    return renderMarkdown(value);
  }
}
