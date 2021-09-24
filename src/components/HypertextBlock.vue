<template>
  <div>
    <span><div
      v-if="editor.isEmpty"
      class="placeholder"
    >{{placeholder}}</div>
    <EditorContent :editor="editor"/></span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Editor, EditorContent, JSONContent } from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import { isEqual } from 'lodash'

@Component ({
  components: {
    EditorContent,
  }
})
export default class HypertextBlock extends Vue {
  @Prop() editable?: boolean;
  @Watch('editable', { immediate: true })
  onEditableChange(newValue: boolean): void {
    this.editor.setOptions({
      editable: newValue,
    });
  }

  @Prop() contents?: JSONContent[];
  @Watch('contents', { immediate: true })
  onContentsChange(newValue: JSONContent[]): void {
    const editorContents = this.editor.getJSON();
    if(!isEqual(editorContents.content, newValue)) {
      this.editor.commands.setContent(newValue, false);
    }
  }

  @Prop() placeholder?: string;

  editor = new Editor({
    content: '',
    extensions: [
      StarterKit,
    ],
    onUpdate: () => {
      const doc = this.editor.getJSON();
      this.$emit('change', {
        value: doc.content,
        previousValue: this.contents ? this.contents.slice() : undefined,
      });
    }
  });

  beforeDestroy(): void {
    this.editor.destroy();
  }
}
</script>
<style lang="stylus" scoped>
.placeholder
  content attr(data-placeholder-text)
  color lightgray
  font-style italic
  position absolute
  pointer-events none
</style>
