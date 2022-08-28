<template>
  <HypertextContentEditor
    :context="source"
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
import VirtualBook, { PathStep } from '@/classes/VirtualBook'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import HypertextContentEditor from '@/components/HypertextContentEditor.vue'

@Component ({
  components: {
    HypertextContentEditor,
  },
})
export default class VirtualBookSnippetRenderer extends Vue {
  @Prop() source?: VirtualBook;
  @Prop() path?: PathStep[];
  @Prop() editable?: boolean;
  @Prop() placeholder?: string;

  get content(): JSONContent | null {
    return this.source && this.path
      ? VirtualBook.resolvePath(this.source, this.path) as JSONContent
      : null;
  }

  get wrappedContent(): JSONContent[] {
    return this.content ? [this.content] : [];
  }

  onContentChange(change: ValueChangeDescription<JSONContent[]>): void {
    const request = new SetValueRequest({
      path: this.path?.concat('content'),
      value: change.value[0].content,
      previousValue: change.previousValue?.length
        ? change.previousValue[0].content
        : undefined,
    });
    this.$emit('change', request);
  }
}
</script>
