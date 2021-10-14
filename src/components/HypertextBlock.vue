<template>
  <div>
    <div
      v-if="editor.isEmpty"
      class="placeholder"
    >{{placeholder}}</div>
    <EditorContent :editor="editor"/>
    <bubble-menu
      v-if="editor"
      :editor="editor"
      class="menu-box"
    >
      <button
        :class="{ 'active-tag-button': linkActive }"
        @click="toggleLink()"
      >
        <LinkIcon size="1x"/>
      </button>
      <LinkEditor
        v-if="linkActive"
        :editor="editor"
      />
    </bubble-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
  Editor,
  EditorContent,
  JSONContent,
  BubbleMenu,
} from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { LinkIcon } from 'vue-feather-icons'
import { isEqual } from 'lodash'
import LinkEditor from '@/components/LinkEditor.vue'

@Component ({
  components: {
    EditorContent,
    BubbleMenu,
    LinkIcon,
    LinkEditor,
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
      Link,
    ],
    onUpdate: () => {
      const doc = this.editor.getJSON();
      this.$emit('change', {
        value: doc.content,
        previousValue: this.contents ? this.contents.slice() : undefined,
      });
    }
  });

  get linkActive(): boolean {
    return this.editor.isActive('link');
  }

  beforeDestroy(): void {
    this.editor.destroy();
  }

  toggleLink(): void {
    if(this.linkActive) {
      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();
    } else {
      this.editor
        .chain()
        .focus()
        .setLink({ href: '' })
        .run();
    }
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
  margin-left 2px
.menu-box
  border 1px solid gray
  background-color white
.active-tag-button
  background-color yellow
</style>
