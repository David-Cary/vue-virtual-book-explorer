import { JSONContent } from '@tiptap/vue-2'

export class VirtualBookSection {
  id = '';
  title = '';
  content: JSONContent[] = [];
  sections: VirtualBookSection[] = [];
}

export type VirtualBookContent = VirtualBookSection | JSONContent;

export type PathStep = string | number;

export type ValueMap = {[k: string]: unknown};

export interface VirtualBookContentSearchCriteria {
  id?: string;
  path?: PathStep[];
}

export interface VirtualBookContentReference {
  source?: VirtualBook;
  path?: PathStep[];
  value?: VirtualBookContent;
}

export type VirtualBookContentCallback = (
  item: VirtualBookContent,
  path: PathStep[],
  source: VirtualBook
) => boolean | void;

export default class VirtualBook {
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
    subset?: VirtualBookContent[],
    path?: PathStep[]
  ): void {
    if(subset) {
      for(let i = 0; i < subset.length; i++) {
        const item = subset[i];
        const subpath = path ? path.concat(i) : [i];
        const signal = callback(item, subpath, source);
        if(signal !== false) {
          if(item.content) {
            VirtualBook.forContentIn(source, callback, item.content, subpath.concat('content'));
          }
          if('marks' in item && item.marks) {
            VirtualBook.forContentIn(source, callback, item.marks, subpath.concat('marks'));
          } else if(item.sections) {
            VirtualBook.forContentIn(source, callback, item.sections, subpath.concat('sections'));
          }
        }
      }
    } else if(source && source.sections) {
      VirtualBook.forContentIn(source, callback, source.sections, ['sections']);
    }
  }

  static findContent(
    source: VirtualBook,
    evaluate: VirtualBookContentCallback | VirtualBookContentSearchCriteria,
    subset?: VirtualBookContent[],
    path?: PathStep[]
  ): VirtualBookContentReference | null {
    if('path' in evaluate && evaluate.path) {
      const match = VirtualBook.resolvePath(source, evaluate.path);
      if(match) {
        return {
          source,
          path: evaluate.path,
          value: match as VirtualBookContent,
        }
      }
    } else {
      if(subset) {
        for(let i = 0; i < subset.length; i++) {
          const item = subset[i];
          const subpath = path ? path.concat(i) : [i];
          const matched = typeof evaluate === 'function'
            ? evaluate(item, subpath, source)
            : VirtualBook.checkContentCriteria(item, evaluate);
          if(matched) {
            return {
              source,
              path: subpath,
              value: item,
            };
          }
          if(item.content) {
            const match = VirtualBook.findContent(source, evaluate, item.content, subpath.concat('content'));
            if(match) return match;
          }
          if('marks' in item && item.marks) {
            const match = VirtualBook.findContent(source, evaluate, item.marks, subpath.concat('marks'));
            if(match) return match;
          } else if(item.sections) {
            const match = VirtualBook.findContent(source, evaluate, item.sections, subpath.concat('sections'));
            if(match) return match;
          }
        }
      } else if(source && source.sections) {
        return VirtualBook.findContent(source, evaluate, source.sections, ['sections']);
      }
    }
    return null;
  }

  static checkContentCriteria(
    target: VirtualBookContent,
    criteria: VirtualBookContentSearchCriteria
  ): boolean {
    if(criteria.id) {
      if(VirtualBook.getContentId(target) !== criteria.id) {
        return false;
      }
    }
    return true;
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
}
