export interface CommendOptions {
  /** Bold */
  '**'?(text: string): string;
  /** Italics */
  __?(text: string): string;
  /** Strikethrough */
  '~~'?(text: string): string;
  /** Unordered list */
  '-'?(items: string[]): string;
  /** Ordered list */
  '.'?(items: string[]): string;
  /** Spoiler */
  '||'?(text: string): string;
  /** URL */
  '<>'?(href: string, text: string): string;
  /** Mention */
  '@'?(text: string): string;
  /** Newline replacement */
  '\n'?: string;
}
declare function commend(options: CommendOptions): (str: string) => string;
export = commend;
