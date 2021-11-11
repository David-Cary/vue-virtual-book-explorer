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
        <button
          v-if="snippetPossible"
          :class="{ 'active-tag-button': snippetActive }"
          @click="toggleSnippet()"
        >
          <CropIcon size="1x"/>
        </button>
      </div>
      <div v-if="snippetActive">
        <IdField
          :source="context"
          :value="snippetId"
          placeholder="Snippet Id"
          @change="onSnippetIdChange($event)"
        />
      </div>
      <div>
        <TagIcon size="1x"/>
        <input
          type="text"
          placeholder="classes"
          :value="textClasses"
          @change="setTextClasses($event.target.value)"
        />
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
import {
  CropIcon,
  LinkIcon,
  TagIcon,
} from 'vue-feather-icons'
import { isEqual } from 'lodash'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import VirtualBook from '@/classes/VirtualBook'
import { Snippet } from '@/schema/Snippet'
import { TextClass } from '@/schema/TextClass'
import IdField from '@/components/IdField.vue'
import LinkEditor from '@/components/LinkEditor.vue'

@Component ({
  components: {
    EditorContent,
    BubbleMenu,
    IdField,
    CropIcon,
    LinkIcon,
    LinkEditor,
    TagIcon,
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
      Snippet,
      TextClass,
    ],
    onUpdate: () => {
      const doc = this.editor.getJSON();
      this.$emit('change', {
        value: doc.content,
        previousValue: this.content ? this.content.slice() : undefined,
      });
    }
  });

  get textClasses(): string {
    return this.editor.getAttributes('textClass').class;
  }

  setTextClasses(value: string): void {
    if(value) {
      this.editor
        .chain()
        .focus()
        .setMark('textClass')
        .updateAttributes('textClass', { class: value })
        .run();
    } else {
      this.editor
        .chain()
        .focus()
        .unsetMark('textClass')
        .run();
    }
  }

  get linkActive(): boolean {
    return this.editor.isActive('link');
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

  get snippetPossible(): boolean {
    if(this.snippetActive) return true;
    return this.editor.can().setSnippet({ id: '' });
  }
  get snippetActive(): boolean {
    return this.editor.isActive('snippet');
  }

  toggleSnippet(): void {
    if(this.snippetActive) {
      this.editor
        .chain()
        .focus()
        .releaseSnippet()
        .run();
    } else {
      this.editor
        .chain()
        .focus()
        .setSnippet({ id: '' })
        .run();
    }
  }

  get snippetId(): string {
    return this.editor.getAttributes('snippet').id;
  }

  onSnippetIdChange(change: ValueChangeDescription<string>): void {
    this.editor
      .chain()
      .focus()
      .updateAttributes('snippet', { id: change.value })
      .run();
  }

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
  margin-left 2px
.menu-box
  border 1px solid gray
  background-color white
  width max-content
.active-tag-button
  background-color yellow
</style>
