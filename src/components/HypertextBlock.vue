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
      <div>
        <button
          :class="{ 'active-tag-button': linkActive }"
          @click="toggleLink()"
        >
          <LinkIcon size="1x"/>
        </button>
      </div>
      <div>
        <LinkEditor
          v-if="linkActive"
          :editor="editor"
          :context="context"
        />
      </div>
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
import VirtualBook from '@/classes/VirtualBook'
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
  @Prop() context?: VirtualBook;
  @Prop() editable?: boolean;
  @Watch('editable', { immediate: true })
  onEditableChange(newValue: boolean): void {
    this.editor.setOptions({
      editable: newValue,
    });
  }

  @Prop() content?: JSONContent[];
  @Watch('content', { immediate: true })
  onContentChange(newValue: JSONContent[]): void {
    const editorContent = this.editor.getJSON();
    if(!isEqual(editorContent.content, newValue)) {
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
        previousValue: this.content ? this.content.slice() : undefined,
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
  width max-content
.active-tag-button
  background-color yellow
</style>
