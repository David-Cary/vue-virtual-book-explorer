<template>
  <HypertextContentEditor
    :context="context"
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
import VirtualBook from '@/classes/VirtualBook'
import HypertextContentEditor from '@/components/HypertextContentEditor.vue'

@Component ({
  components: {
    HypertextContentEditor,
  },
})
export default class HypertextNodeEditor extends Vue {
  @Prop() context?: VirtualBook;
  @Prop() editable?: boolean;
  @Prop() content?: JSONContent;
  @Prop() placeholder?: string;

  get wrappedContent(): JSONContent[] {
    return this.content ? [this.content] : [];
  }

  get searchContext(): VirtualBook {
    return this.context ? this.context : new VirtualBook();
  }

  onContentChange(change: ValueChangeDescription<JSONContent[]>): void {
    if(this.content) {
      const targetNode = this.content;
      const matched = VirtualBook.findContent(
        this.searchContext,
        (item) => 'type' in item && item.type === targetNode.type,
        change.value
      )
      if(matched && matched.value && 'type'in matched.value) {
        this.$emit('change', {
          value: matched.value,
          previousValue: this.content,
        });
      }
    }
  }
}
</script>
