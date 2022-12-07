<template>
  <HypertextContentEditor
    :sourceData="sourceData"
    :content="wrappedContent"
    :editable="editable"
    :placeholder="placeholder"
    @change="onContentChange($event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { JSONContent } from '@tiptap/vue-2'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import {
  VirtualBookContentReference,
  VirtualBookDataCache,
  VirtualBookContentNode,
} from '@/classes/VirtualBook'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import HypertextContentEditor from '@/components/HypertextContentEditor.vue'

@Component ({
  components: {
    HypertextContentEditor,
  },
})
export default class VirtualBookSnippetRenderer extends Vue {
  @Prop() value?: VirtualBookContentReference;
  @Prop() sourceData?: VirtualBookDataCache;
  @Prop() editable?: boolean;
  @Prop() placeholder?: string;

  get contentNode(): VirtualBookContentNode | null {
    return this.value?.node?.value || null;
  }

  get content(): JSONContent | null {
    return this.contentNode || null;
  }

  get wrappedContent(): JSONContent[] {
    return this.content ? [this.content] : [];
  }

  onContentChange(change: ValueChangeDescription<JSONContent[]>): void {
    const previousNode = change.previousValue
      ? this.findIdNode(change.previousValue)
      : null;
    const currentNode = change.value
      ? this.findIdNode(change.value)
      : null;
    if(currentNode) {
      const request = new SetValueRequest({
        path: this.value?.propertyPath,
        value: currentNode,
        previousValue: previousNode,
      });
      this.$emit('change', request);
    }
  }

  findIdNode(source: JSONContent[]): JSONContent | null {
    for(const node of source) {
      if(node.attrs?.id !== undefined) {
        return node;
      }
      if(node.content) {
        const match = this.findIdNode(node.content);
        if(match) {
          return match;
        }
      }
    }
    return null;
  }
}
</script>
