/** Chat typeahead (`:emoji:` and `@user` completion). Also exposed as `window.TH`. */

export interface TypeaheadEntry {
  key: string;
  value: string;
}

type EntryCallback = (entry: TypeaheadEntry) => string;

const identity: EntryCallback = (entry) => entry.value;

class Trigger {
  /**
   * @param char Single-character trigger.
   * @param dbType Name of the database to search.
   * @param hasPair Whether the match also ends with `char` (`:word:` vs `@word`).
   * @param minLength Minimum match length (excluding `char`) before suggesting.
   */
  constructor(
    public char: string,
    public dbType: string,
    public hasPair = false,
    public minLength = 0,
  ) {}
}

class TriggerMatch {
  constructor(
    public start: number,
    public end: number,
    public trigger: Trigger,
    public word: string,
  ) {}
}

class Database {
  private data: Record<string, string>;

  /**
   * @param name Accessor key.
   * @param initData Initial entries.
   * @param caseSensitive Whether searches are case sensitive.
   * @param leftAnchored `startsWith` instead of `includes`.
   * @param inserter Text inserted when an entry is picked.
   * @param renderer Text shown for an entry.
   */
  constructor(
    public name: string,
    initData: Record<string, string> = {},
    private caseSensitive = false,
    public leftAnchored = false,
    public inserter: EntryCallback = identity,
    public renderer: EntryCallback = identity,
  ) {
    this.data = initData;
  }

  private fixKey(key: string) {
    return this.caseSensitive ? key.trim() : key.toLowerCase().trim();
  }

  search(start: string): TypeaheadEntry[] {
    const needle = this.fixKey(start);
    return Object.entries(this.data)
      .filter(([key]) => (this.leftAnchored ? this.fixKey(key).startsWith(needle) : this.fixKey(key).includes(needle)))
      .map(([key, value]) => ({ key, value }));
  }

  addEntry(key: string, value: string) {
    this.data[key.trim()] = value;
  }

  removeEntry(key: string) {
    delete this.data[key.trim()];
  }
}

class Typeahead {
  triggers: Record<string, Trigger> = {};
  private triggerChars: string[] = [];

  /**
   * @param triggers Trigger definitions.
   * @param stops Characters that end a match.
   * @param databases Databases to search.
   */
  constructor(
    triggers: Trigger[] | Trigger,
    public stops: string[] = [' '],
    public databases: Database[] = [],
  ) {
    for (const trigger of Array.isArray(triggers) ? triggers : [triggers]) {
      this.triggers[trigger.char] = trigger;
      if (!this.triggerChars.includes(trigger.char)) this.triggerChars.push(trigger.char);
    }
  }

  /**
   * Scans left of `startIndex` for a trigger, then right for the end of the word.
   * Returns `false` when there's no (long enough) match.
   */
  scan(startIndex: number, text: string): TriggerMatch | false {
    let start = 0;
    let trigger: Trigger | null = null;
    let foundOnce = false;
    for (let i = startIndex - 1; i >= 0; i--) {
      const char = text.charAt(i);
      if (this.triggerChars.includes(char)) {
        start = i;
        trigger = this.triggers[char]!;
        // Keep going once so ending a ":word:" doesn't match the closing colon.
        if (foundOnce) break;
        foundOnce = true;
      } else if (this.stops.includes(char)) {
        break;
      }
    }
    if (!trigger) return false;

    let end = text.length;
    for (let i = startIndex; i < text.length; i++) {
      if (this.stops.includes(text.charAt(i))) {
        end = i;
        break;
      }
    }
    // Don't search with the closing pair character.
    const wordEnd = trigger.hasPair && text.charAt(end - 1) === trigger.char ? end - 1 : end;
    const match = new TriggerMatch(start, end, trigger, text.substring(start + 1, wordEnd));
    return match.word.length >= trigger.minLength ? match : false;
  }

  suggestions(match: TriggerMatch): TypeaheadEntry[] {
    return this.getDatabase(match.trigger.dbType)?.search(match.word) ?? [];
  }

  getDatabase(name: string): Database | null {
    return this.databases.find((db) => db.name === name.trim()) ?? null;
  }
}

export const TH = { Typeahead, TriggerMatch, Trigger, Database };

export type TypeaheadDatabase = Database;
export type TypeaheadMatch = TriggerMatch;
