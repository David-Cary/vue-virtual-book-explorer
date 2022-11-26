import {
  DescentResult,
  CommonKey,
  ValidKey,
  WrappedArrayStrategy,
  getNestedValue,
  traverseContents,
  getSibling,
  getLeaf,
} from '@/ts/utilities/TraversalState';

// Content Nodes are roughly equivalent to prosemirror nodes.

export interface TypedData {
  type: string;
}

export interface VirtualBookTextNodeState extends TypedData {
  text: string;
}

export interface VirtualBookIdentifiedNode {
  id: string;
}

export interface VirtualBookValueNode {
  localName: string;
  evaluateAs: string;
  hiddenValue: unknown;
}

export interface VirtualBookGlobalNode {
  globalName: string;
}

export interface VirtualBookTemplateSource {
  isTemplate: boolean;
}

export interface VirtualBookContentAttributeMap extends
  Partial<VirtualBookIdentifiedNode>,
  Partial<VirtualBookGlobalNode>,
  Partial<VirtualBookTemplateSource>,
  Partial<VirtualBookValueNode>
{
  [key: string]: unknown;
}

export interface VirtualBookTextBranchState {
  type: string;
  attrs: VirtualBookContentAttributeMap;
  content: VirtualBookContentNode[];
}

export interface VirtualBookContentNode extends
  Partial<VirtualBookTextBranchState>,
  Partial<VirtualBookTextNodeState>
{}

// Book sections are ways of grouping content that associate a header with
// a set of content blocks and subsections.

export enum SectionDisplayTypes {
  SHOW_SUBSECTIONS_SEPARATELY = "separate"
}

export interface VirtualBookSectionSearchOptions {
  path: ValidKey[];
}

export interface VirtualBookSectionState {
  id: string;
  title: string;
  content: VirtualBookContentNode[];
  sections: VirtualBookSection[];
  sectionDisplay?: string;
}

export class VirtualBookSection implements VirtualBookSectionState {
  id = '';
  title = '';
  content: VirtualBookContentNode[] = [];
  sections: VirtualBookSection[] = [];
  sectionDisplay?: string;

  constructor(source?: VirtualBookSectionState) {
    if(source) {
      Object.assign(this, source);
      if(source.sections) {
        this.sections = source.sections.map(
          item => new VirtualBookSection(item)
        );
      }
      this.content = source.content;
    }
  }

  static contentStrategy = new WrappedArrayStrategy<VirtualBookSection, VirtualBookContentNode> (
    (source) => source.content || [],
  );

  static cloneSection(source: VirtualBookSectionState): VirtualBookSection {
    const cloned = new VirtualBookSection();
    cloned.title = source.title;
    cloned.content = source.content.map(
      node => VirtualBook.cloneNode(node)
    );
    cloned.sections = source.sections.map(
      subsection => VirtualBookSection.cloneSection(subsection)
    );
    if(source.sectionDisplay !== undefined) {
      cloned.sectionDisplay = source.sectionDisplay;
    }
    return cloned;
  }
}

export type VirtualBookContent = VirtualBookSection | VirtualBookContentNode;

export type StringMap = Record<string, string>;

export type StyleRuleMap = Record<string, StringMap>;

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

export function mapRecord<S, T = S>(
  source: Record<string, S>,
  callback: (value: S, key?: string) => T,
): Record<string, T> {
  const results: Record<string, T> = {};
  for(const key in source) {
    results[key] = callback(source[key], key);
  }
  return results;
}

export interface VirtualBookDerivedData {
  contentById: RecordWithKeys<VirtualBookContentReference[]>;
  globalContent: RecordWithKeys<VirtualBookContentReference[]>;
  templates: RecordWithKeys<VirtualBookContentReference[]>;
}

export interface VirtualBookContentSearchOptions {
  id: string;
  section: Partial<VirtualBookSectionSearchOptions>;
  node: Partial<VirtualBookSectionSearchOptions>;
}

export type VirtualBookContentContainer = VirtualBook | VirtualBookContent;

export enum VirtualBookNodeAttributes {
  CONTENT_ID = 'id',
  GLOBAL_NAME = 'globalName',
  LOCAL_NAME = 'localName',
  TEMPLATE_FLAG = 'isTemplate',
}

export default class VirtualBook implements VirtualBookState {
  style: StyleRuleMap = {};
  sections: VirtualBookSection[] = [];

  constructor(source?: VirtualBookState) {
    if(source) {
      Object.assign(this, source);
      if(source.sections) {
        this.sections = source.sections.map(item => new VirtualBookSection(item));
      }
    }
  }

  get contentById(): Record<string, VirtualBookContentReference[]> {
    return this.getContentMap(item => VirtualBook.getContentId(item));
  }

  get globalContent(): Record<string, VirtualBookContentReference[]> {
    return this.getContentMap(
      item => {
        const key = VirtualBook.getContentAttribute(
          item,
          VirtualBookNodeAttributes.GLOBAL_NAME,
        );
        return key ? String(key) : '';
      }
    );
  }

  get derivedData(): VirtualBookDerivedData {
    const globalContent = this.globalContent;
    const templates = VirtualBook.filterContentMap(
      this.globalContent,
      item => {
        if(item.section.value) {
          return Boolean(VirtualBook.getContentAttribute(
            item.section.value,
            VirtualBookNodeAttributes.TEMPLATE_FLAG,
          ));
        }
        return false;
      },
    );
    return {
       contentById: getRecordWithKeys(this.contentById, true),
       globalContent: getRecordWithKeys(globalContent, true),
       templates: getRecordWithKeys(templates, true),
    };
  }

  getContentMap(
    getKeyFor: (source: VirtualBookContent) => string | undefined,
  ): Record<string, VirtualBookContentReference[]> {
    const contentMap: Record<string, VirtualBookContentReference[]> = {};
    this.traverseContents((content, section, node) => {
      const key = getKeyFor(content);
      if(key) {
        const ref = new VirtualBookContentReference(
          DescentResult.clone(section),
          node ? DescentResult.clone(node) : undefined,
        );
        if(contentMap[key]) {
          contentMap[key].push(ref)
        } else {
          contentMap[key] = [ref];
        }
      }
    });
    return contentMap;
  }

  getSection(key: ValidKey): VirtualBookContentReference | null {
    const section = getNestedValue(
      this,
      [ key ],
      VirtualBook.sectionStrategy,
    );
    return new VirtualBookContentReference(section);
  }

  findContent(
    options: Partial<VirtualBookContentSearchOptions>,
    cachedData?: VirtualBookDerivedData | null,
  ): VirtualBookContentReference[] {
    if(options.id) {
      const contentMap = cachedData?.contentById.values || this.contentById;
      const refs = contentMap[options.id];
      if(refs) {
        return refs;
      }
    }
    if(options.section?.path) {
      const sectionResult = getNestedValue(
        this,
        options.section.path,
        VirtualBook.sectionStrategy,
      );
      return [
        new VirtualBookContentReference(sectionResult)
      ];
    }
    return [];
  }

  traverseContents(
    callback: (
      content: VirtualBookContent,
      sections: DescentResult<VirtualBook, ValidKey, VirtualBookSection>,
      nodes?: DescentResult<VirtualBookSection, ValidKey, VirtualBookContentNode>,
    ) => boolean | void,
  ): void {
    traverseContents(
      this,
      {
        preOrder: (section, sectionState, sectionStrategy) => {
          const sectionResult = new DescentResult(
            sectionState,
            sectionStrategy,
          );
          callback(section, sectionResult);
          traverseContents(
            section,
            {
              preOrder: (node, nodeState, nodeStrategy) => callback(
                node,
                sectionResult,
                new DescentResult(
                  nodeState,
                  nodeStrategy,
                )
              ),
            },
            VirtualBookSection.contentStrategy,
          )
        },
      },
      VirtualBook.sectionStrategy,
    );
  }

  static filterContentMap(
    source: Record<string, VirtualBookContentReference[]>,
    predicate: (source: VirtualBookContentReference) => boolean,
  ): Record<string, VirtualBookContentReference[]> {
    const contentMap: Record<string, VirtualBookContentReference[]> = {};
    for(const key in source) {
      const refs = source[key];
      const filtered = refs.filter(predicate);
      if(filtered.length) {
        contentMap[key] = filtered;
      }
    }
    return contentMap;
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

  static getContentId(target: VirtualBookContentContainer): string | undefined {
    if('id' in target) {
      return target.id;
    }
    const id = VirtualBook.getContentAttribute(
      target,
      VirtualBookNodeAttributes.CONTENT_ID,
    );
    if(id !== undefined) {
      return String(id);
    }
  }

  static getContentAttribute(
    target: VirtualBookContentContainer,
    key: string,
  ): unknown {
    if('attrs' in target && target.attrs) {
      return target.attrs[key];
    }
  }

  static sectionStrategy = new WrappedArrayStrategy<VirtualBook, VirtualBookSection> (
    (source) => source.sections,
  );

  static createHRef(
    callback: CreateHRef,
    options: Partial<VirtualBookContentSearchOptions>,
    propKey?: string,
  ): string {
    if(propKey) {
      const wrapped = {
        [propKey]: options,
      };
      return callback(wrapped);
    }
    return callback(options);
  }

  static cloneAttributes(
    source: VirtualBookContentAttributeMap,
    exclude?: string[],
  ): VirtualBookContentAttributeMap {
    const attrs: VirtualBookContentAttributeMap = {};
    const keys = Object.keys(source);
    if(exclude) {
      for(const key of exclude) {
        const index = keys.indexOf(key);
        keys.splice(index, 1);
      }
    }
    for(const key of keys) {
      attrs[key] = cloneDeep(source[key]);
    }
    return attrs;
  }

  static cloneNode(
    source: VirtualBookContentNode,
  ): VirtualBookContentNode {
    const result: VirtualBookContentNode = {};
    if(source.type) {
      result.type = source.type;
    }
    if(source.attrs) {
      result.attrs = VirtualBook.cloneAttributes(
        source.attrs,
        [
          VirtualBookNodeAttributes.CONTENT_ID,
          VirtualBookNodeAttributes.GLOBAL_NAME,
        ],
      );
    }
    if(source.content) {
      result.content = source.content.map(
        node => VirtualBook.cloneNode(node)
      );
    }
    if(source.text !== undefined) {
      result.text = source.text;
    }
    return result;
  }
}

export function cloneDeep(source:unknown): unknown {
  if(typeof source === 'object') {
    if(Array.isArray(source)) {
      return source.map(item => cloneDeep(item));
    }
    if(source) {
      const record = source as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for(const key in record) {
        result[key] = cloneDeep(record[key]);
      }
      return result;
    }
  }
  return source;
}

// Helper class for handling content references and navigation.

export interface VirtualBookSearchPath {
  section: ValidKey[],
  node: ValidKey[],
}

export type SectionSearchResult = DescentResult<
  VirtualBook,
  ValidKey,
  VirtualBookSection
>;

export type ContentNodeSearchResult = DescentResult<
  VirtualBookSection,
  ValidKey,
  VirtualBookContentNode
>;

export class VirtualBookContentReference {
  readonly section: SectionSearchResult;
  readonly node?: ContentNodeSearchResult;

  constructor(
    section: SectionSearchResult,
    node?: ContentNodeSearchResult,
  ) {
    this.section = section;
    this.node = node;
  }

  get book(): VirtualBook {
    return this.section.state.root;
  }

  get subsections(): VirtualBookContentReference[] {
    if(this.section.value) {
      return this.section.value.sections.map(
        (subsection, index) => {
          const result = this.section.getNestedValue([index]);
          return new VirtualBookContentReference(result);
        }
      );
    }
    return [];
  }

  get nextSection(): VirtualBookContentReference | null {
    const subsection = this.getSubsection(0);
    if(subsection) {
      return subsection;
    }
    const sibling = getSibling(
      this.section.state,
      1,
      this.section.strategy,
      true,
    );
    if(sibling) {
      return new VirtualBookContentReference(sibling);
    }
    return null;
  }

  get previousSection(): VirtualBookContentReference | null {
    const sibling = getSibling(
      this.section.state,
      -1,
      this.section.strategy,
      true,
    );
    if(sibling) {
      const leaf = getLeaf(
        sibling.state.root,
        -1,
        this.section.strategy,
        sibling.state.descent,
      );
      if(leaf?.value) {
        return new VirtualBookContentReference(leaf);
      }
    }
    return null;
  }

  get id(): string | null {
    if(this.node) {
      const node = this.node.value;
      if(node) {
        const id = VirtualBook.getContentId(node);
        if(id) {
          return id;
        }
      }
    }
    const section = this.section.value;
    if(section) {
      const id = VirtualBook.getContentId(section);
      if(id) {
        return id;
      }
    }
    return null;
  }

  get propertyPath(): CommonKey[] {
    const results: CommonKey[] = [];
    let sectionParent: VirtualBook | VirtualBookSection = this.section.state.root;
    for(let i = 0; i < this.section.state.descent.length; i++) {
      const entry = this.section.state.descent[i];
      if(entry?.value) {
        const index = sectionParent.sections.indexOf(entry.value);
        results.push('sections', index);
        sectionParent = entry.value;
      } else {
        break;
      }
    }
    if(this.node) {
      let nodeParent: VirtualBookContent = this.node.state.root;
      for(let i = 0; i < this.node.state.descent.length; i++) {
        const entry = this.node.state.descent[i];
        if(entry?.value && nodeParent.content) {
          const index = nodeParent.content.indexOf(entry.value);
          results.push('content', index);
          nodeParent = entry.value;
        } else {
          break;
        }
      }
    }
    return results;
  }

  get sectionAncestry(): VirtualBookContentReference[] {
    const refs: VirtualBookContentReference[] = [];
    const numSections = this.node
      ? this.section.state.descent.length
      : this.section.state.descent.length - 1;
    for(let i = 1; i <= numSections; i++) {
      refs.push(
        new VirtualBookContentReference(
          new DescentResult(
            {
              root: this.section.state.root,
              descent: this.section.state.descent.slice(0, i),
            },
            this.section.strategy,
          ),
        ),
      );
    }
    return refs;
  }

  getContentLabel(
    typeLabels = {
      section: 'Section',
      node: 'Content',
    },
  ): string {
    if(this.node) {
      const entry = this.node.finalEntry;
      return entry
        ? `${typeLabels.node} ${String(entry.key)}`
        : typeLabels.node;
    }
    if(this.section) {
      const entry = this.section.finalEntry;
      return entry
        ? entry.value?.title || `${typeLabels.section} ${String(entry.key)}`
        : typeLabels.section;
    }
    return '';
  }

  getSubsection(key: CommonKey): VirtualBookContentReference | null {
    const result = this.section.getNestedValue([key]);
    return result.value ? new VirtualBookContentReference(result) : null;
  }

  createHRef(
    callbacks: Record<string, CreateHRef>,
    propKey?: string,
  ): string {
    return this.createIdHREF(callbacks, propKey)
      || this.createPathHREF(callbacks, propKey);
  }

  createIdHREF(
    callbacks: Record<string, CreateHRef>,
    propKey?: string,
  ): string {
    if(callbacks[StandardVirtualBookRoutes.FIND_CONTENT_BY_ID]) {
      const id = this.id;
      if(id) {
        return VirtualBook.createHRef(
          callbacks[StandardVirtualBookRoutes.FIND_CONTENT_BY_ID],
          {
            id,
          },
          propKey,
        );
      }
    }
    return '';
  }

  createPathHREF(
    callbacks: Record<string, CreateHRef>,
    propKey?: string,
  ): string {
    if(callbacks[StandardVirtualBookRoutes.FIND_CONTENT_AT]) {
      return VirtualBook.createHRef(
        callbacks[StandardVirtualBookRoutes.FIND_CONTENT_AT],
        {
          section: {
            path: this.section.path,
          },
          node: {
            path: this.node?.path || [],
          },
        },
        propKey,
      );
    }
    return '';
  }
}

export type CreateHRef = (values?: unknown) => string;

export enum StandardVirtualBookRoutes {
  FIND_CONTENT_AT = 'findContentAt',
  FIND_CONTENT_BY_ID = 'findContentById',
}
