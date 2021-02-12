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
  /** Quote */
  '>'?(text: string): string;
  /**
   * Whether quotes can stretch multiple lines (blockquotes) or a newline always ends the quote (greentexting)
   * @default true
   */
  '>continuous'?: boolean;
  /** Mention */
  '@'?(text: string): string;
  /**
   * Whether to stop parsing the current mention (this character won't be included)
   * @param parsed Accumulated mention text
   */
  '@end'?(char: string, parsed: text): boolean;
  /** Newline replacement */
  '\n'?: string;
}
declare function commend(options: CommendOptions): (str: string) => string;
export = commend;
