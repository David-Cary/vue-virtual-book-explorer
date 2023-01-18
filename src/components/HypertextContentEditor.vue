<template>
  <div>
    <div v-if="editable">
      <div>
        <button
          :class="{ 'active-tag-button': marksInSelection['link'] }"
          @click="toggleLink()"
        >
          <LinkIcon size="1x"/>
        </button>
        <button
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
          <MenuIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['outerBlock'] }"
          @click="toggleOuterBlock()"
        >
          <CreditCardIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['svg'] }"
          @click="toggleSVG()"
        >
          <PenToolIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['compiledText'] }"
          @click="toggleCompiledText()"
        >
          <CpuIcon size="1x"/>
        </button>
        <button
          :class="{ 'active-tag-button': selectionNodeTypes['echo'] }"
          @click="toggleEcho()"
        >
          <CastIcon size="1x"/>
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
            :usedIds="sourceData.contentIds"
            :value="selectedNode.node.attrs.id"
            @change="editor.commands.setNodeId(selectedNode.pos, $event.value)"
          />
        </div>
        <div v-if="selectedNode.node.type.attrs.class">
          <label class="row-label">Classes</label>
          <input
            type="text"
            :value="selectedNode.node.attrs.class"
            @change="editor.commands.setNodeClass(selectedNode.pos, $event.target.value)"
          />
        </div>
        <div v-if="selectedNode.node.type.attrs.localName">
          <label class="row-label">Local Name</label>
          <IdField
            :usedIds="selectedNodeLocalValues.keys"
            :value="selectedNode.node.attrs.localName"
            @change="editor.commands.setValueNode({localName: $event.value || undefined}, selectedNode.pos)"
          />
        </div>
        <div v-if="selectedNode.node.type.attrs.evaluateAs">
          <input
            type="checkbox"
            :checked="selectedNode.node.attrs.evaluateAs"
            @change="toggleEvaluated(selectedNode)"
          >
          <span>Evaluated</span>
          <span v-if="selectedNode.node.attrs.evaluateAs">
            as
            <select
              :value="selectedNode.node.attrs.evaluateAs"
              @change="editor.commands.setValueNode({evaluateAs: $event.target.value}, selectedNode.pos)"
            >
              <option
                v-for="key in evaluatorKeys"
                :key="key"
              >{{key}}</option>
            </select>
          </span>
        </div>
        <div v-if="selectedNode.node.type.attrs.hiddenValue" class="flex-row">
          <label class="row-label">Hidden Value</label>
          <JSValueEditor
            :value="selectedNode.node.attrs.hiddenValue"
            @change="onHiddenValueChange(selectedNode, $event)"
          />
        </div>
        <div v-if="selectedNode.node.type.attrs.sourcePath" class="flex-row">
          <label class="row-label">Source Path</label>
          <SourcePathField
            :sourceData="sourceData"
            :value="selectedNode.node.attrs.sourcePath"
            @change="editor.commands.setEchoPath($event.value, selectedNode.pos)"
          />
        </div>
        <div v-if="selectedNode.node.type.name === 'echo'" class="flex-row">
          <button @click="instantiateEchoes()">
            <CastIcon size="1x"/>
            <ArrowRightIcon size="1x"/>
            <CopyIcon size="1x"/>
          </button>
        </div>
        <div v-if="selectedNode.node.type.attrs.echoInTemplate">
          <input
            type="checkbox"
            :checked="selectedNode.node.attrs['echoInTemplate']"
            @change="toggleEchoInTemplate(selectedNode)"
          >
          <label>Clone as Echo</label>
        </div>
        <TableEditor
          v-if="tableElementSelected"
          :editor="editor"
          :nodeType="selectedNode.node.type.name"
        />
        <SVGEditor
          v-if="selectedNode.node.type.name === 'svg'"
          :editor="editor"
          :position="selectedNode.pos"
          :target="selectedNode.node"
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
          <div>
            <label class="row-label">Template</label>
            <textarea
              placeholder="expression"
              :value="selectedNode.node.attrs.template"
              @change="editor.commands.setCompiledText({template: $event.target.value}, selectedNode.pos)"
            />
          </div>
          <div>
            <input
              type="checkbox"
              :checked="selectedNode.node.attrs['refreshOnUpdate']"
              @change="toggleRefreshOnUpdate(selectedNode)"
            >
            <label>Refresh on Update</label>
          </div>
        </div>
        <div v-if="selectedNode.node.type.name === 'text'">
          <label class="row-label">Classes</label>
          <input
            type="text"
            placeholder="text classes"
            :value="textClasses"
            @change="setTextClasses($event.target.value)"
          />
        </div>
        <LinkEditor
          v-if="selectedMarks['link']"
          :ids="sourceData.contentIds"
          :editor="editor"
          :position="selectedNode.pos"
        />
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
  NodeWithPos,
  findChildrenInRange,
} from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Mark, Node } from 'prosemirror-model'
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
  CastIcon,
  ArrowRightIcon,
  CopyIcon,
  PenToolIcon,
} from 'vue-feather-icons'
import {
  isEqual,
  clone,
  set,
} from 'lodash'
import {
  VirtualBookDataCache,
  RecordWithKeys,
  getRecordWithKeys,
} from '@/ts/data/VirtualBook'
import { Snippet } from '@/tiptap/Snippet'
import { TextBlock } from '@/tiptap/TextBlock'
import { TextClass } from '@/tiptap/TextClass'
import { OuterBlock } from '@/tiptap/OuterBlock'
import { Echo } from '@/tiptap/Echo'
import { CompiledText, CompileTextProps } from '@/tiptap/CompiledText'
import { SVG } from '@/tiptap/SVG'
import { IdentifiedNodes } from '@/tiptap/extensions/IdentifiedNodes'
import { ClassedNodes } from '@/tiptap/extensions/ClassedNodes'
import {
  ValueNodes,
  defaultEvaluators,
  getNestedValueNode,
  getNodeValue,
  getLocalValuesAt,
} from '@/tiptap/extensions/ValueNodes'
import { template, groupBy } from 'lodash'
import ValueChangeDescription from '@/ts/data/ValueChangeDescription'
import IdField from '@/components/IdField.vue'
import LinkEditor from '@/components/LinkEditor.vue'
import TableEditor from '@/components/TableEditor.vue'
import JSValueEditor from '@/components/JSValueEditor.vue'
import SourcePathField from '@/components/SourcePathField.vue'
import SVGEditor from '@/components/SVGEditor.vue'

@Component ({
  components: {
    EditorContent,
    IdField,
    CropIcon,
    LinkIcon,
    LinkEditor,
    TableEditor,
    JSValueEditor,
    SourcePathField,
    SVGEditor,
    TagIcon,
    ListIcon,
    GridIcon,
    MenuIcon,
    CreditCardIcon,
    Edit3Icon,
    ChevronRightIcon,
    ChevronDownIcon,
    CpuIcon,
    CastIcon,
    ArrowRightIcon,
    CopyIcon,
    PenToolIcon,
  }
})
export default class HypertextContentEditor extends Vue {
  @Prop() sourceData?: VirtualBookDataCache;
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

  selectionNodes: NodeWithPos[] = [];

  get selectionNodeTypes(): Record<string, NodeWithPos[]> {
    return groupBy(this.selectionNodes, (ref) => ref.node?.type.name);
  }

  selectedNode: NodeWithPos | null = null;

  evaluatorKeys = Object.keys(defaultEvaluators).sort();

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
      IdentifiedNodes.configure({
        types: [
          'paragraph',
          'bulletList',
          'orderedList',
          'table',
          'outerBlock',
          'textBlock',
          'snippet',
          'compiledText',
          'svg',
        ],
      }),
      ClassedNodes.configure({
        types: [
          'paragraph',
          'bulletList',
          'orderedList',
          'table',
          'tableRow',
          'tableCell',
          'tableHeader',
          'outerBlock',
          'textBlock',
          'compiledText',
          'snippet',
        ]
      }),
      Echo.configure({
        getTemplate: (path) => {
          const keys = path.map(value => String(value));
          return this.sourceData
            ? this.sourceData.getTemplate(keys)
            : null;
        },
        getContentPath: (source) => source.localValuePath,
        castableTypes: [
          'snippet',
          'textBlock',
          'outerBlock',
        ],
      }),
      ValueNodes.configure({
        types: [
          'snippet',
          'outerBlock',
          'textBlock',
          'paragraph',
          'bulletList',
          'orderedList',
          'table',
          'compiledText',
        ]
      }),
      CompiledText.configure({
        context: {
          Math,
          Boolean,
          Number,
          String,
          Array,
          Object,
          getLocalValue: (path: string[]) => {
            const node = getNestedValueNode(this.editor.state.doc, path);
            if(node) {
              return getNodeValue(node);
            }
            return undefined;
          },
          getContentValue: (path: string[]) => {
            if(this.sourceData && path.length > 1) {
              const data = this.sourceData.getLocalNode(path);
              const content = data?.source?.node?.value;
              if(content) {
                const node = Node.fromJSON(
                  this.editor.schema,
                  content
                );
                return getNodeValue(node);
              }
            }
            return undefined;
          },
          parseTemplate: (
            expression: string,
            terms: Record<string, unknown> = {},
          ) => {
            const parse = template(expression);
            return parse(terms);
          },
          evaluate: (
            expression: string,
            terms: Record<string, unknown> = {},
          ) => {
            const parse = template(`<%= ${expression} %>`);
            return parse(terms);
          },
        },
        compileText: (props: CompileTextProps) => {
          const parse = template(props.expression);
          return parse(props.context);
        }
      }),
      SVG,
    ],
    enableInputRules: false,
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
    this.selectionNodes = findChildrenInRange(
      this.editor.state.doc,
      {
        from: selection.from,
        to: selection.to
      },
      node => node !== undefined
    );
    if(this.selectedNode) {
      this.selectedNode = this.selectionNodes.find(
        ref => ref.pos === this.selectedNode?.pos
      ) || null;
    }
  }

  getNodeLabel(ref: NodeWithPos): string {
    if(ref.node) {
      if(ref.node.attrs.id) {
        return `#${ref.node.attrs.id}`;
      }
      if(ref.node.attrs.localName) {
        return `['${ref.node.attrs.localName}']`;
      }
      if(ref.node.type.name === 'text') {
        const text = ref.node.text || '';
        const charLimit = 16;
        const trimmed = text.length > charLimit
          ? `${text.substring(0,16)}..`
          : text;
        return `"${trimmed}"`
      }
      if(ref.node.attrs.class) {
        return `.${ref.node.attrs.class.replace(' ','.')}`;
      }
      return `${ref.node.type.name}`;
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

  toggleLink(): void {
    if(this.marksInSelection['link']) {
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

  get snippetActive(): boolean {
    return this.editor.isActive('snippet');
  }

  toggleSnippet(): void {
    this.editor
      .chain()
      .focus()
      .toggleSnippet()
      .run();
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

  toggleEvaluated(ref: NodeWithPos): void {
    if(this.editor) {
      const newValue = ref.node.attrs.evaluateAs ? undefined : 'text';
      this.editor
        .chain()
        .focus()
        .setValueNode(
          {
            evaluateAs: newValue,
          },
          ref.pos,
        )
        .run();
    }
  }

  onHiddenValueChange(
    ref: NodeWithPos,
    event: ValueChangeDescription<unknown>
  ): void {
    if(this.editor) {
      let hiddenValue = event.value;
      if(event.path) {
        hiddenValue = clone(ref.node.attrs.hiddenValue);
        if(typeof hiddenValue === 'object' && hiddenValue) {
          set(hiddenValue, event.path, event.value);
        }
      }
      this.editor
        .chain()
        .focus()
        .setValueNode(
          {
            hiddenValue,
          },
          ref.pos,
        )
        .run();
    }
  }

  toggleRefreshOnUpdate(ref: NodeWithPos): void {
    if(this.editor) {
      const newValue = ref.node.attrs.evaluateAs ? undefined : true;
      this.editor
        .chain()
        .focus()
        .setCompiledText(
          {
            refreshOnUpdate: newValue,
          },
          ref.pos,
        )
        .run();
    }
  }

  toggleSVG(): void {
    this.editor
      .chain()
      .focus()
      .insertContent({
        type: 'svg',
      })
      .run();
  }

  toggleEcho(): void {
    if(this.selectionNodeTypes['echo']) {
      this.editor.chain().focus().undoEchoes().run();
    } else {
      this.editor.chain().focus().insertEcho().run();
    }
  }

  toggleEchoInTemplate(ref: NodeWithPos): void {
    if(this.editor) {
      const newValue = ref.node.attrs.evaluateAs ? undefined : true;
      this.editor
        .chain()
        .focus()
        .setEchoInTemplate(
          newValue,
          ref.pos,
        )
        .run();
    }
  }

  instantiateEchoes(): void {
    this.editor.chain().focus().instantiateEchoes().run();
  }

  onSelectNode(value: string): void {
    const pos = Number(value);
    this.selectedNode = this.selectionNodes.find(ref => ref.pos === pos) || null;
  }

  get selectedMarks(): Record<string, Mark> {
    const markMap: Record<string, Mark> = {};
    if(this.selectedNode?.node) {
      for(const mark of this.selectedNode.node.marks) {
        markMap[mark.type.name] = mark;
      }
    }
    return markMap;
  }

  get marksInSelection(): Record<string, Mark[]> {
    const markMap: Record<string, Mark[]> = {};
    for(const ref of this.selectionNodes) {
      if(ref.node) {
        for(const mark of ref.node.marks) {
          const key = mark.type.name;
          if(!markMap[key]) {
            markMap[key] = []
          }
          markMap[mark.type.name].push(mark);
        }
      }
    }
    return markMap;
  }

  get selectedNodeLocalValues(): RecordWithKeys<NodeWithPos> {
    const values = this.selectedNode
      ? getLocalValuesAt(
        this.editor.state.doc,
        this.selectedNode.pos,
      )
      : {};
    return getRecordWithKeys<NodeWithPos>(values, true);
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
  margin-top 1em
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
  vertical-align top
.row-label:after
  content ':'
.property-card
  margin 4px
.tab-label
  font-weight bold
  padding-left 8px
  padding-right 8px
  border 1px solid silver
  border-radius 8px 8px 0 0
.flex-row
  display flex
</style>
<style lang="stylus">
.ProseMirror[contenteditable=true] table
  border 1px dotted gray
.ProseMirror[contenteditable=true] tr
  border 1px dotted gray
.ProseMirror[contenteditable=true] td
  border 1px dotted gray
.ProseMirror[contenteditable=true] th
  border 1px dotted gray
.ProseMirror[contenteditable=true] [data-type=snippet]
  border 1px dashed gray
  padding 1px
.ProseMirror[contenteditable=true] [data-type=compiledText]
  border 1px dotted gray
.ProseMirror[contenteditable=true] [data-type=echo]
  border 1px dotted gray
</style>
