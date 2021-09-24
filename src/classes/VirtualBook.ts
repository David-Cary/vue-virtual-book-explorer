import { JSONContent } from '@tiptap/vue-2'

export class VirtualBookSection {
  title = '';
  contents: JSONContent[] = [];
  sections: VirtualBookSection[] = [];
}

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
}
