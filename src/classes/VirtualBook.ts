import { NodeDescriptionChild } from '@/classes/NodeDescription'

export class VirtualBookSection {
  title = '';
  contents: NodeDescriptionChild[] = [];
  sections: VirtualBookSection[] = [];
}

export default class VirtualBook {
  sections: VirtualBookSection[] = [];
}
