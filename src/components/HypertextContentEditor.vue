<template>
  <div>
    <div
      v-if="editor.isEmpty"
      class="placeholder"
    >{{placeholder}}</div>
    <EditorContent :editor="editor"/>
    <bubble-menu
      v-if="editor && editable"
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
        <button @click="toggleBulletList()">
          <ListIcon size="1x"/>
        </button>
        <button
          v-if="!inTable"
          @click="insertTable()"
        >
          <GridIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': inTextBlock }"
          @click="toggleTextBlock()"
        >
          <MenuIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': inTopicBlock }"
          @click="toggleTopicBlock()"
        >
          <CreditCardIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNamed }"
          @click="toggleName()"
        >
          <Edit3Icon size="1x"/>
        </button>
      </div>
      <div v-if="inTable" class="flex-row">
        <GridIcon size="1x"/>
        <TableEditor :editor="editor"/>
      </div>
      <div v-if="inTopicBlock" class="flex-row">
        <CreditCardIcon size="1x"/>
        <NamedBlockEditor
          :context="context"
          :editor="editor"
          typeName="topicBlock"
          typeLabel="Topic"
        />
      </div>
      <div v-if="inTextBlock" class="flex-row">
        <MenuIcon size="1x"/>
        <NamedBlockEditor
          :context="context"
          :editor="editor"
          typeName="textBlock"
          typeLabel="Text Block"
        />
      </div>
      <div v-if="inBulletList | inOrderedList">
        <ListIcon size="1x"/>
        <input
          type="checkbox"
          checked="inOrderedList"
          @change="toggleListType()"
        />
        <label>Ordered?</label>
      </div>
      <div v-if="snippetActive">
        <IdField
          :source="context"
          :value="snippetId"
          placeholder="Snippet Id"
          @change="onSnippetIdChange($event)"
        />
      </div>
      <div v-if="selectionNamed">
        <Edit3Icon size="1x"/>
        <input
          type="text"
          placeholder="name"
          :value="selectionName"
          @change="setName($event.target.value)"
        />
      </div>
      <div>
        <TagIcon size="1x"/>
        <input
          type="text"
          placeholder="text classes"
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
    <floating-menu
      v-if="editor"
      :editor="editor"
      class="menu-box"
    >
      <button @click="insertTable()">
        <GridIcon size="1x"/>
      </button>
    </floating-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
  Editor,
  EditorContent,
  JSONContent,
  BubbleMenu,
  FloatingMenu
} from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  CropIcon,
  LinkIcon,
  TagIcon,
  ListIcon,
  GridIcon,
  MenuIcon,
  CreditCardIcon,
  Edit3Icon,
} from 'vue-feather-icons'
import { isEqual } from 'lodash'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import VirtualBook from '@/classes/VirtualBook'
import { Snippet } from '@/schema/Snippet'
import { TextBlock } from '@/schema/TextBlock'
import { TextClass } from '@/schema/TextClass'
import { TopicBlock } from '@/schema/TopicBlock'
import { TextName } from '@/schema/TextName'
import IdField from '@/components/IdField.vue'
import LinkEditor from '@/components/LinkEditor.vue'
import TableEditor from '@/components/TableEditor.vue'
import NamedBlockEditor from '@/components/NamedBlockEditor.vue'

@Component ({
  components: {
    EditorContent,
    BubbleMenu,
    FloatingMenu,
    IdField,
    CropIcon,
    LinkIcon,
    LinkEditor,
    TableEditor,
    NamedBlockEditor,
    TagIcon,
    ListIcon,
    GridIcon,
    MenuIcon,
    CreditCardIcon,
    Edit3Icon,
  }
})
export default class HypertextContentEditor extends Vue {
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
      TextBlock,
      TextClass,
      TopicBlock,
      TextName,
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    onUpdate: () => {
      const doc = this.editor.getJSON();
      this.$emit('change', {
        value: doc.content,
        previousValue: this.content ? this.content.slice() : undefined,
      });
    }
  });

  get inBulletList(): boolean {
    return this.editor.isActive('bulletList');
  }

  toggleBulletList(): void {
    this.editor.chain().focus().toggleBulletList().run();
  }

  get inOrderedList(): boolean {
    return this.editor.isActive('orderedList');
  }

  toggleListType(): void {
    if(this.inBulletList) {
      this.editor.chain().focus().toggleBulletList().toggleOrderedList().run();
    } else {
      this.editor.chain().focus().toggleOrderedList().toggleBulletList().run();
    }
  }

  get inTable(): boolean {
    return this.editor.isActive('table');
  }

  insertTable(): void {
    this.editor.chain().focus().insertTable().run();
  }

  get inTextBlock(): boolean {
    return this.editor.isActive('textBlock');
  }

  toggleTextBlock(): void {
    if(this.inTextBlock) {
      this.editor.chain().focus().setNode('paragraph').run();
    } else {
      this.editor.chain().focus().setTextBlock().run();
    }
  }

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

  get inTopicBlock(): boolean {
    return this.editor.isActive('topicBlock');
  }

  toggleTopicBlock(): void {
    this.editor.chain().focus().toggleTopicBlock().run();
  }

  get selectionNamed(): boolean {
    return this.editor.isActive('textName');
  }

  get selectionName(): string {
    return this.editor.getAttributes('textName').name;
  }

  toggleName(): void {
    if(this.selectionNamed) {
      this.editor
        .chain()
        .focus()
        .unsetMark('textName')
        .run();
    } else {
      this.editor
        .chain()
        .focus()
        .setMark('textName')
        .run();
    }
  }

  setName(value: string): void {
    this.editor
      .chain()
      .focus()
      .updateAttributes('textName', { name: value })
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
.flex-row
  display flex
</style>
