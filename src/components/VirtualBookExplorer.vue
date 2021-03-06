<template>
  <div>
    <div
      v-if="model"
      class="vbook-explorer-body"
    >
      <ScopedStyleRenderer :rules="model.style"/>
      <TableOfContents
        :model="model"
        :editable="editing"
        @change="$emit('change', $event)"
      />
      <div
        v-if="targetContent"
        class="vbook-explorer-content-pane"
      >
        <div class="vbook-breadcrumbs-bar">
          <BreadcrumbLinks :reference="targetContent"/>
        </div>
        <div class="vbook-body">
          <VirtualBookSectionRenderer
            v-if="targetContent.value.sections"
            :source="model"
            :path="targetContent.path"
            :value="targetContent.value"
            :editable="editing"
            @change="$emit('change', $event)"
          />
          <HypertextNodeEditor
            v-else
            :context="model"
            :content="targetContent.value"
            :editable="editing"
            placeholder="Target Content"
            @change="onContentChange($event)"
          />
        </div>
        <VirtualBookSectionsNavBar :reference="targetContent"/>
      </div>
      <div v-else>Content Not Found</div>
    </div>
    <div v-else>Book Not Found</div>
    <div>
      <button
        :class="{ 'active-button': editing }"
        @click="editing = !editing"
      >
        <EditIcon size="1x"/>
      </button>
      <button
        v-if="editing"
        @click="showingStyle = true"
      >
        <CodeIcon size="1x"/>
      </button>
      <button
        v-if="editing"
        @click="onClickRevert()"
      >
        <Trash2Icon size="1x"/>
      </button>
      <VirtualBookExporter
        :model="model"
        @showPreview="previewHTML = $event.value"
      />
      <VirtualBookImporter
        v-if="editing"
        @complete="onImportReady($event)"
      />
    </div>
    <ModalLayer
      v-if="showingStyle"
      @close="showingStyle = false"
    >
      <template v-slot:header>Style Rules</template>
      <StyleEditor
        :value="model.style"
        :suggestedSelectors="suggestedSelectors"
        @change="onStyleChange($event)"
      />
    </ModalLayer>
    <ModalLayer
      v-if="previewHTML"
      @close="previewHTML = ''"
    >
      <template v-slot:header>Exporter Preview</template>
      <div v-html="previewHTML"/>
    </ModalLayer>
  </div>
</template>

<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EditIcon, Trash2Icon, CodeIcon } from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookContentSearchCriteria,
  VirtualBookContentReference,
  PathStep,
} from '@/classes/VirtualBook'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'
import HypertextNodeEditor from '@/components/HypertextNodeEditor.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import BreadcrumbLinks from '@/components/BreadcrumbLinks.vue'
import VirtualBookSectionsNavBar from '@/components/VirtualBookSectionsNavBar.vue'
import VirtualBookExporter from '@/components/VirtualBookExporter.vue'
import VirtualBookImporter from '@/components/VirtualBookImporter.vue'
import ModalLayer from '@/components/ModalLayer.vue'
import ScopedStyleRenderer from '@/components/ScopedStyleRenderer.vue'
import StyleEditor from '@/components/StyleEditor.vue'

@Component ({
  components: {
    VirtualBookSectionRenderer,
    HypertextNodeEditor,
    TableOfContents,
    BreadcrumbLinks,
    VirtualBookSectionsNavBar,
    EditIcon,
    Trash2Icon,
    CodeIcon,
    VirtualBookExporter,
    VirtualBookImporter,
    ModalLayer,
    ScopedStyleRenderer,
    StyleEditor,
  }
})
export default class VirtualBookExplorer extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() contentCriteria?: VirtualBookContentSearchCriteria;

  editing = false;
  showingStyle = false;
  suggestedSelectors = [
    'p',
    'a',
    'table',
    'th',
    'tr',
    'td',
    '.vbook-body',
    '.vbook-breadcrumbs-bar',
    '.vbook-section',
    '.vbook-section-nav-bar',
  ];

  previewHTML = '';

  get targetContent(): VirtualBookContentReference | null {
    if(this.model && this.contentCriteria) {
      return VirtualBook.findContent(this.model, this.contentCriteria);
    }
    return null;
  }

  onClickRevert(): void {
    const confirmed = window.confirm('All changes will be lost. Are you sure?');
    if(confirmed) {
      this.$emit(
        'change',
        new SetValueRequest({
          value: new VirtualBook(),
          previousValue: this.model,
        })
      );
    }
  }

  onImportReady(book: VirtualBook): void {
    this.$emit(
      'change',
      new SetValueRequest({
        value: book,
        previousValue: this.model,
      })
    );
  }

  onContentChange(change: ValueChangeDescription<VNode[]>): void {
    const request = new SetValueRequest(change);
    if(!request.path && this.targetContent) {
      request.path = this.targetContent.path;
    }
    this.$emit('change', request);
  }

  onStyleChange(change: ValueChangeDescription<unknown>): void {
    let path: PathStep[] = ['style'];
    if(change.path) {
      path = path.concat(change.path);
    }
    this.$emit(
      'change',
      new SetValueRequest({
        value: change.value,
        previousValue: change.previousValue,
        path
      })
    );
  }
}
</script>

<style lang="stylus" scoped>
.vbook-explorer-body
  display flex
.vbook-explorer-content-pane
  width -webkit-fill-available
.active-button
  background-color yellow
</style>
