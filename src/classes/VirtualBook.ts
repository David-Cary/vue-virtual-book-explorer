import { JSONContent } from '@tiptap/core'

export interface VirtualBookSectionState {
  id: string;
  title: string;
  content: JSONContent[];
  sections: VirtualBookSection[];
  sectionDisplay?: string;
}

export class VirtualBookSection implements VirtualBookSectionState {
  id = '';
  title = '';
  content: JSONContent[] = [];
  sections: VirtualBookSection[] = [];
  sectionDisplay?: string;

  static fromState(
    source: VirtualBookSectionState
  ): VirtualBookSection {
    const result = new VirtualBookSection();
    Object.assign(result, source);
    result.sections = VirtualBookSection.sectionsFromState(source.sections);
    return result;
  }

  static sectionsFromState(
    source: VirtualBookSectionState[]
  ): VirtualBookSection[] {
    const result = source.map(state => VirtualBookSection.fromState(state));
    return result;
  }
}

export type VirtualBookContent = VirtualBookSection | JSONContent;

export type VirtualBookContentState = VirtualBookSectionState | JSONContent;

export type PathStep = string | number;

export type ValueMap = Record<string, unknown>;

export type StringMap = Record<string, string>;

export type StyleRuleMap = Record<string, StringMap>;

export type VirtualBookContentSearchFilter= (
  item: VirtualBookContent,
  path?: PathStep[],
  source?: VirtualBook
) => boolean | number;

export interface VirtualBookContentSearchOptions {
  path: PathStep[];
  matchVia: VirtualBookContentSearchFilter;
}

export interface VirtualBookContentSearchResult {
  path: PathStep[];
}

export interface VirtualBookContentReference {
  source: VirtualBook;
  path: PathStep[];
  value?: VirtualBookContent;
  collectionKey?: string;
  index?: number;
}

export type VirtualBookContentCallback = (
  item: VirtualBookContent,
  path?: PathStep[],
  source?: VirtualBook
) => boolean | void;

export enum SectionDisplayTypes {
  SHOW_SUBSECTIONS_SEPARATELY = "separate"
}

export interface VirtualBookState {
  style: StyleRuleMap;
  sections: VirtualBookSectionState[];
}

export interface RecordWithKeys<T> {
  values: Record<string, T>;
  keys: string[];
}

export function getRecordWithKeys<T>(
  source: Record<string, T>,
  sorted = false,
): RecordWithKeys<T> {
  const results = {
    values: source,
    keys: Object.keys(source),
  };
  if(sorted) {
    results.keys.sort();
  }
  return results;
}

export function filterRecord<T>(
  source: Record<string, T>,
  filter: (value: T, key?: string) => boolean,
): Record<string, T> {
  const results: Record<string, T> = {};
  for(const key in source) {
    const value = source[key];
    if(filter(value, key)) {
      results[key] = value;
    }
  }
  return results;
}

export interface VirtualBookDerivedData {
  contentById: RecordWithKeys<VirtualBookContent>;
  globalContent: RecordWithKeys<VirtualBookContent>;
  templates: RecordWithKeys<VirtualBookContent>;
}

export default class VirtualBook implements VirtualBookState {
  style: StyleRuleMap = {};
  sections: VirtualBookSection[] = [];

  get contentById(): Record<string, VirtualBookContent> {
    const contentMap: Record<string, VirtualBookContent> = {};
    VirtualBook.forContentIn(
      this,
      item => {
        const key = VirtualBook.getContentId(item);
        if(key) {
          contentMap[key] = item;
        }
      }
    );
    return contentMap;
  }

  get contentIds(): string[] {
    const contentMap = this.contentById;
    return Object.keys(contentMap);
  }

  get globalContent(): Record<string, VirtualBookContent> {
    const contentMap: Record<string, VirtualBookContent> = {};
    VirtualBook.forContentIn(
      this,
      item => {
        const key = VirtualBook.getContentAttribute<string>(item, 'globalName');
        if(key) {
          contentMap[key] = item;
        }
      }
    );
    return contentMap;
  }

  get templates(): Record<string, VirtualBookContent> {
    const contentMap: Record<string, VirtualBookContent> = {};
    VirtualBook.forContentIn(
      this,
      item => {
        const attrs = VirtualBook.getContentAttributes(item);
        if(attrs && attrs.globalName && attrs.isTemplate) {
          const key = String(attrs.globalName);
          contentMap[key] = item;
        }
      }
    );
    return contentMap;
  }

  get derivedData(): VirtualBookDerivedData {
    const globalContent = this.globalContent;
    const templates = filterRecord<VirtualBookContent>(
      globalContent,
      item => Boolean(
        VirtualBook.getContentAttribute<boolean>(item, 'isTemplate')
      )
    );
    return {
       contentById: getRecordWithKeys(this.contentById, true),
       globalContent: getRecordWithKeys(globalContent, true),
       templates: getRecordWithKeys(templates, true),
    };
  }

  static fromState(source: VirtualBookState): VirtualBook {
    const result = new VirtualBook();
    result.style = source.style;
    result.sections = VirtualBookSection.sectionsFromState(source.sections);
    return result;
  }

  static getContentAttribute<T>(
    source: VirtualBookContent,
    attributeName: string
  ): T | undefined {
    if('attrs' in source && source.attrs) {
      return source.attrs[attributeName];
    }
    return undefined
  }

  static getContentAttributes(
    source: VirtualBookContent
  ): ValueMap | undefined {
    if('attrs' in source && source.attrs) {
      return source.attrs;
    }
    return undefined
  }

  static getLocalContent(
    source: VirtualBookContent | JSONContent[],
    results: Record<string, VirtualBookContent> = {}
  ): Record<string, VirtualBookContent> {
    if(Array.isArray(source)) {
      for(const item of source) {
        VirtualBook.getLocalContent(item);
      }
    } else {
      const key = VirtualBook.getContentAttribute<string>(source, 'localName');
      if(key) {
        results[key] = source;
      } else if(source.content) {
        VirtualBook.getLocalContent(source.content);
      }
    }
    return results;
  }

  static getPathToSection(
    source: VirtualBook | VirtualBookSection,
    target: VirtualBookSection
  ): (string | number)[] | undefined {
    if(source) {
      for(let i = 0; i < source.sections.length; i++) {
        const subsection = source.sections[i];
        if(subsection === target) {
          return ['sections', i];
        }
        const subpath = VirtualBook.getPathToSection(subsection, target);
        if(subpath) {
          return ['sections', i].concat(subpath);
        }
      }
    }
    return undefined;
  }

  static forContentIn(
    source: VirtualBook,
    callback: VirtualBookContentCallback,
    path?: PathStep[],
    target?: VirtualBookContent | VirtualBookContent[]
  ): void {
    if(path) {
      const validatedTarget = target || VirtualBook.resolvePath(source, path);
      if(Array.isArray(validatedTarget)) {
        for(let i = 0; i < validatedTarget.length; i++) {
          const item = validatedTarget[i] as VirtualBookContent;
          const subpath = path ? path.concat(i) : [i];
          VirtualBook.forContentIn(source, callback, subpath, item);
        }
      } else {
        const targetContent = target as VirtualBookContent;
        const signal = callback(targetContent, path, source);
        if(signal !== false) {
          if(targetContent.content) {
            VirtualBook.forContentIn(
              source,
              callback,
              path.concat('content'),
              targetContent.content
            );
          }
          if(targetContent.sections) {
            VirtualBook.forContentIn(
              source,
              callback,
              path.concat('sections'),
              targetContent.sections
            );
          }
        }
      }
    } else if(source.sections) {
      VirtualBook.forContentIn(source, callback, ['sections'], source.sections);
    }
  }

  static searchBookContents(
    source: VirtualBook,
    options: Partial<VirtualBookContentSearchOptions>
  ): VirtualBookContentSearchResult[] {
    const results: VirtualBookContentSearchResult[] = [];
    VirtualBook.forContentIn(
      source,
      (item: VirtualBookContent, path?: PathStep[]) => {
        if(options.matchVia) {
          const matched = options.matchVia(item, path, source);
          if(!matched) {
            return;
          }
        }
        results.push({ path: path || [] });
        return false;
      },
      options.path
    );
    return results;
  }

  static searchResultToReference(
    result: VirtualBookContentSearchResult,
    source: VirtualBook
  ): VirtualBookContentReference {
    return {
      source,
      path: result.path,
      value: VirtualBook.resolvePath(source, result.path) as VirtualBookContent,
      collectionKey: result.path.length > 1
        ? String(result.path[result.path.length - 2])
        : undefined,
      index: result.path.length > 1
        ? Number(result.path[result.path.length - 1])
        : undefined
    };
  }

  static getContentId(target: VirtualBookContent): string | undefined {
    if('id' in target) return target.id;
    return VirtualBook.getContentAttribute<string>(target, 'id');
  }

  static resolvePath(source: unknown, path: PathStep[]): unknown {
    if(typeof source === 'object') {
      let target = source as ValueMap;
      for(let i = 0; i < path.length; i++) {
        const step = path[i];
        if(target && typeof target[step] === 'object') {
          target = target[step] as ValueMap;
        } else {
          return undefined;
        }
      }
      return target;
    }
  }

  static getContentReferenceStack(
    reference: VirtualBookContentReference
  ): VirtualBookContentReference[] {
    const stack: VirtualBookContentReference[] = [];
    if(reference && reference.path) {
      let parent: VirtualBook | VirtualBookContent | undefined = reference.source;
      for(let i = 0; i < reference.path.length; i += 2) {
        if(parent) {
          const collectionKey = String(reference.path[i]);
          const index = Number(reference.path[i + 1]);
          const entry: VirtualBookContentReference = {
            source: reference.source,
            path: reference.path.slice(0, i + 2),
            collectionKey,
            index,
          };
          entry.value = VirtualBook.resolvePath(
            parent,
            [collectionKey, index]
          ) as VirtualBookContent;
          stack.push(entry);
          parent = entry.value;
        }
      }
    }
    return stack;
  }

  static getLastSeparateSubsection(
    reference: VirtualBookContentReference
  ): VirtualBookContentReference {
    // If the section has separately displayed subsections, delegate to the
    // last of those.
    if(reference.value
      && reference.value.sectionDisplay === SectionDisplayTypes.SHOW_SUBSECTIONS_SEPARATELY
      && reference.value.sections.length
      && reference.path
    ) {
      const lastIndex = reference.value.sections.length - 1;
      return VirtualBook.getLastSeparateSubsection({
        source: reference.source,
        path: reference.path.concat('sections', lastIndex),
        value: reference.value.sections[lastIndex],
      })
    }
    // Pass back the reference we got.
    return reference;
  }

  static getNextSection(
    reference: VirtualBookContentReference
  ): VirtualBookContentReference | null {
    // If the section has separately displayed children, put the first of those next.
    if(reference
      && reference.value
      && reference.value.sectionDisplay === SectionDisplayTypes.SHOW_SUBSECTIONS_SEPARATELY
      && reference.value.sections.length
      && reference.path
    ) {
      return {
        source: reference.source,
        path: reference.path.concat('sections', 0),
        value: reference.value.sections[0],
      };
    }
    // Otherwise, move on up the stack to find the next available section.
    const stack = VirtualBook.getContentReferenceStack(reference);
    while(stack.length) {
      const target = stack.pop();
      if(target && target.path && target.collectionKey && target.index !== undefined) {
        const parent = stack.length
          ? stack[stack.length - 1].value
          : target.source;
        const collection = VirtualBook.resolvePath(
          parent,
          [target.collectionKey]
        );
        if(Array.isArray(collection)) {
          const nextIndex = target.index + 1;
          const nextTarget = collection[nextIndex];
          if(nextTarget) {
            const basePath = target.path.slice(0, target.path.length - 1);
            return {
              source: reference.source,
              path: basePath.concat(nextIndex),
              value: nextTarget,
            };
          }
        }
      }
    }
    return null;
  }

  static getPreviousSection(
    reference: VirtualBookContentReference
  ): VirtualBookContentReference | null {
    const stack = VirtualBook.getContentReferenceStack(reference);
    while(stack.length) {
      const target = stack.pop();
      if(target && target.path && target.collectionKey && target.index !== undefined) {
        const parent = stack.length
          ? stack[stack.length - 1].value
          : target.source;
        const collection = VirtualBook.resolvePath(
          parent,
          [target.collectionKey]
        );
        if(Array.isArray(collection)) {
          const nextIndex = target.index - 1;
          const nextTarget = collection[nextIndex];
          if(nextTarget) {
            const basePath = target.path.slice(0, target.path.length - 1);
            const targetReference: VirtualBookContentReference = {
              source: reference.source,
              path: basePath.concat(nextIndex),
              value: nextTarget,
            };
            return VirtualBook.getLastSeparateSubsection(targetReference);
          }
          // If we're the first separately displayed subsection of our parent,
          // shift the display to that parent.
          if(parent && 'content' in parent) {
            const parentSection = parent as VirtualBookSection;
            if(parentSection.sectionDisplay === SectionDisplayTypes.SHOW_SUBSECTIONS_SEPARATELY
              && nextIndex === -1
            ) {
              return {
                source: reference.source,
                path: target.path.slice(0, target.path.length - 2),
                value: parent as VirtualBookSection,
              }
            }
          }
        }
      }
    }
    return null;
  }
}
