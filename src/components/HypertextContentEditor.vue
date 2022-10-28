<template>
  <div>
    <div v-if="editable">
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
        <button
          :class="{ 'active-tag-button': listInSelection}"
          @click="toggleList()"
        >
          <ListIcon size="1x"/>
        </button>
        <button
          v-if="!selectionNodeTypes['table']"
          @click="insertTable()"
        >
          <GridIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['textBlock'] }"
          @click="toggleTextBlock()"
        >
          <span :is="nodeTypeData['textBlock'].icon" size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['outerBlock'] }"
          @click="toggleOuterBlock()"
        >
          <span :is="nodeTypeData['outerBlock'].icon" size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['compiledText'] }"
          @click="toggleCompiledText()"
        >
          <span :is="nodeTypeData['compiledText'].icon" size="1x"/>
        </button>
      </div>
      <div v-if="selectionNodes.length">
        <select
          :value="selectedNode ? selectedNode.pos : -1"
          @change="onSelectNode($event.target.value)"
        >
          <option value="-1">{{selectedNode ? 'Clear Selection' : 'Select Item' }}</option>
          <option
            v-for="(ref, index) in selectionNodes"
            :key="index"
            :value="ref.pos"
          >{{getNodeLabel(ref)}}</option>
        </select>
      </div>
      <div v-if="selectedNode" class="selected-node-property-pane">
        <div v-if="selectedNode.node.type.attrs.id">
          <label class="row-label">Id</label>
          <IdField
            :source="context"
            :value="selectedNode.node.attrs.id"
            @change="setNodeAttribute(selectedNode.pos, 'id', $event.value)"
          />
        </div>
        <div v-if="selectedNode.node.type.attrs.class">
          <label class="row-label">Classes</label>
          <input
            type="text"
            :value="selectedNode.node.attrs.class"
            @change="setNodeAttribute(selectedNode.pos, 'class', $event.target.value)"
          />
        </div>
        <TableEditor
          v-if="tableElementSelected"
          :editor="editor"
          :nodeType="selectedNode.node.type.name"
        />
        <div v-if="listSelected">
          <label class="row-label">Type</label>
          <select
            :value="selectedNode.node.type.name"
            @change="setListType($event.target.value)"
          >
            <option
              v-for="type in listTypes"
              :key="type"
              :value="type"
            >{{type}}</option>
          </select>
        </div>
        <div v-if="selectedNode.node.type.name === 'compiledText'">
          <label class="row-label">Template</label>
          <input
            type="text"
            placeholder="expression"
            :value="selectedNode.node.attrs.template"
            @change="setNodeAttribute(selectedNode.pos, 'template', $event.target.value)"
          >
        </div>
        <div v-if="selectedNode.node.type.name === 'text'">
          <div>
            <label class="row-label">Classes</label>
            <input
              type="text"
              placeholder="text classes"
              :value="textClasses"
              @change="setTextClasses($event.target.value)"
            />
          </div>
          <LinkEditor
            v-if="linkActive"
            :editor="editor"
            :context="context"
          />
        </div>
      </div>
    </div>
    <div
      v-if="editor.isEmpty"
      class="placeholder"
    >{{placeholder}}</div>
    <div :class="{ 'content-editor-pane': editable }">
      <EditorContent :editor="editor"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
  Editor,
  EditorContent,
  JSONContent,
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
  ChevronRightIcon,
  ChevronDownIcon,
  CpuIcon,
} from 'vue-feather-icons'
import { isEqual } from 'lodash'
import VirtualBook from '@/classes/VirtualBook'
import { Snippet } from '@/tiptap/Snippet'
import { TextBlock } from '@/tiptap/TextBlock'
import { TextClass } from '@/tiptap/TextClass'
import { OuterBlock } from '@/tiptap/OuterBlock'
import { EnableAttributes } from '@/tiptap/EnableAttributes'
import { CompiledText, CompileTextProps } from '@/tiptap/CompiledText'
import getNodesInRange, { NodeIterationReference } from '@/tiptap/helpers/getNodesInRange'
import { template, groupBy } from 'lodash'
import IdField from '@/components/IdField.vue'
import LinkEditor from '@/components/LinkEditor.vue'
import TableEditor from '@/components/TableEditor.vue'

@Component ({
  components: {
    EditorContent,
    IdField,
    CropIcon,
    LinkIcon,
    LinkEditor,
    TableEditor,
    TagIcon,
    ListIcon,
    GridIcon,
    MenuIcon,
    CreditCardIcon,
    Edit3Icon,
    ChevronRightIcon,
    ChevronDownIcon,
    CpuIcon,
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

  selectionNodes: NodeIterationReference[] = [];

  get selectionNodeTypes(): Record<string, NodeIterationReference[]> {
    return groupBy(this.selectionNodes, (ref) => ref.node?.type.name);
  }

  selectedNode: NodeIterationReference | null = null;

  nodeTypeData = {
    textBlock: {
      icon: 'MenuIcon',
    },
    outerBlock: {
      icon: 'CreditCardIcon',
    },
    compiledText: {
      icon: 'CpuIcon',
    },
  }

  editor = new Editor({
    content: '',
    extensions: [
      StarterKit,
      Link,
      Snippet,
      TextBlock,
      TextClass,
      OuterBlock,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      EnableAttributes.configure({
        enable: [
          {
            types: [
              'paragraph',
              'bulletList',
              'orderedList',
              'table',
              'outerBlock',
              'textBlock',
              'compiledText',
            ],
            attributes: [
              'id',
              'class',
            ],
          },
          {
            types: [
              'tableRow',
              'tableCell',
              'tableHeader',
            ],
            attributes: [
              'class',
            ],
          }
        ],
      }),
      CompiledText.configure({
        context: {
          Math
        },
        compileText: (props: CompileTextProps) => {
          const parse = template(props.expression);
          return parse(props.context);
        }
      }),
    ],
    onUpdate: () => {
      const doc = this.editor.getJSON();
      this.$emit('change', {
        value: doc.content,
        previousValue: this.content ? this.content.slice() : undefined,
      });
      this.refreshSelectionData();
    },
    onSelectionUpdate: () => this.refreshSelectionData(),
  });

  refreshSelectionData(): void {
    const selection = this.editor.state.selection;
    this.selectionNodes = getNodesInRange(
      this.editor.state.doc,
      selection.from,
      selection.to
    );
    if(this.selectedNode) {
      this.selectedNode = this.selectionNodes.find(
        ref => ref.pos === this.selectedNode?.pos
      ) || null;
    }
  }

  getNodeLabel(ref: NodeIterationReference): string {
    if(ref.node) {
      if(ref.node.attrs.id) {
        return ref.node.attrs.id;
      }
      if(ref.node.type.name === 'text') {
        const text = ref.node.text || '';
        const charLimit = 16;
        const trimmed = text.length > charLimit
          ? `${text.substring(0,16)}..`
          : text;
        return `"${trimmed}"`
      }
      return `(${ref.node.type.name})`;
    }
    return 'Missing Node!';
  }

  listTypes = ['bulletList', 'orderedList'];

  get listInSelection(): boolean {
    return this.selectionNodeTypes['bulletList'] !== undefined
      || this.selectionNodeTypes ['orderedList'] !== undefined;
  }

  get listSelected(): boolean {
    const selectedType = this.selectedNode?.node?.type.name || '';
    if(selectedType) {
      return this.listTypes.indexOf(selectedType) >= 0;
    }
    return false;
  }

  toggleList(): void {
    if(this.selectionNodeTypes['orderedList']) {
      this.editor.chain().focus().toggleOrderedList().run();
    } else {
      this.editor.chain().focus().toggleBulletList().run();
    }
    this.refreshSelectionData();
  }

  setListType(value: string): void {
    if(value === 'orderedList') {
      this.editor.chain().focus().toggleBulletList().toggleOrderedList().run();
    } else {
      this.editor.chain().focus().toggleOrderedList().toggleBulletList().run();
    }
  }

  get tableElementSelected(): boolean {
    const selectedType = this.selectedNode?.node?.type.name || '';
    if(selectedType) {
      const tableNodeTypes = ['table', 'tableRow', 'tableCell', 'tableHeader'];
      return tableNodeTypes.indexOf(selectedType) >= 0;
    }
    return false;
  }

  insertTable(): void {
    this.editor.chain().focus().insertTable().run();
  }

  toggleTextBlock(): void {
    if(this.selectionNodeTypes['textBlock']) {
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

  toggleOuterBlock(): void {
    this.editor.chain().focus().toggleOuterBlock().run();
  }


  toggleCompiledText(): void {
    if(this.selectionNodeTypes['compiledText']) {
      this.editor.chain().focus().unwrapCompiledText().run();
    } else {
      this.editor.chain().focus().wrapAsCompiledText().run();
    }
  }

  onSelectNode(value: string): void {
    const pos = Number(value);
    this.selectedNode = this.selectionNodes.find(ref => ref.pos === pos) || null;
  }

  setNodeAttribute(pos: number, key: string, value: string): void {
    this.editor
      .chain()
      .setNodeAttribute(pos, key, value)
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
.content-editor-pane
  overflow-y scroll
  max-height 500px
  border 1px solid silver
.selected-node-property-pane
  border 1px solid silver
.active-tag-button
  background-color yellow
.accordian-header
  border 1px solid gray
  background-color silver
.type-header
  color gray
.row-label
  font-weight bold
  margin-left 2px
  margin-right 2px
.row-label:after
  content ':'
.flex-row
  display flex
</style>
