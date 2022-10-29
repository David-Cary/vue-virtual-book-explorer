import { JSONContent } from '@tiptap/core'

export class VirtualBookSection {
  id = '';
  title = '';
  content: JSONContent[] = [];
  sections: VirtualBookSection[] = [];
  sectionDisplay?: string;
}

export type VirtualBookContent = VirtualBookSection | JSONContent;

export type PathStep = string | number;

export type ValueMap = {[k: string]: unknown};

export type StringMap = {[k: string]: string};

export type StyleRuleMap = {[k: string]: StringMap};

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

export default class VirtualBook {
  style: StyleRuleMap = {};
  sections: VirtualBookSection[] = [];

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
          if('marks' in targetContent && targetContent.marks) {
            VirtualBook.forContentIn(
              source,
              callback,
              path.concat('marks'),
              targetContent.marks
            );
          } else if(targetContent.sections) {
            VirtualBook.forContentIn(
              source,
              callback,
              path.concat('sections'),
              targetContent.sections
            );
          }
        }
      }
    } else if(source && source.sections) {
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

  static getContentId(target: VirtualBookContent): string | null {
    if('id' in target) return target.id;
    if('attrs' in target && target.attrs) {
      return target.attrs.id;
    }
    if('marks' in target && target.marks) {
      for(const mark of target.marks) {
        if(mark && mark.attrs && 'id' in mark.attrs) {
          return mark.attrs.id;
        }
      }
    }
    return null;
  }

  static getIdsIn(source: VirtualBook): string[] {
    const ids: string[] = [];
    VirtualBook.forContentIn(
      source,
      item => {
        if(item.id) {
          ids.push(item.id);
        } else if('attrs' in item && item.attrs && item.attrs.id) {
          ids.push(item.attrs.id);
        }
      }
    );
    return ids;
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
