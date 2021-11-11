<template>
  <div>
    <div
      v-if="model"
      class="vbook-explorer-body"
    >
      <ScopedStyleRenderer :rules="model.style"/>
      <TableOfContents
        :model="model"
        :editable="true"
        :baseURL="sectionByIndicesURL"
        @change="$emit('change', $event)"
      />
      <div
        v-if="targetContent"
        class="vbook-explorer-content-pane"
      >
        <div class="vbook-body">
          <VirtualBookSectionRenderer
            v-if="targetContent.value.sections"
            :source="model"
            :path="targetContent.path"
            :value="targetContent.value"
            :editable="true"
            @change="$emit('change', $event)"
          />
          <HypertextBlock
            v-else
            :context="model"
            :content="[targetContent.value]"
            :editable="true"
            placeholder="Target Content"
            @change="onContentChange($event)"
          />
        </div>
      </div>
      <div v-else>Content Not Found</div>
    </div>
    <div v-else>Book Not Found</div>
    <div>
      <button @click="showingStyle = true">
        <em>CSS</em>
      </button>
      <button @click="onClickRevert()">
        <Trash2Icon size="1x"/>
      </button>
      <VirtualBookExporter
        :model="model"
        @showPreview="previewHTML = $event.value"
      />
      <VirtualBookImporter @complete="onImportReady($event)"/>
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
import { Trash2Icon } from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookContentSearchCriteria,
  VirtualBookContentReference,
  PathStep,
} from '@/classes/VirtualBook'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'
import HypertextBlock from '@/components/HypertextBlock.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import VirtualBookExporter from '@/components/VirtualBookExporter.vue'
import VirtualBookImporter from '@/components/VirtualBookImporter.vue'
import ModalLayer from '@/components/ModalLayer.vue'
import ScopedStyleRenderer from '@/components/ScopedStyleRenderer.vue'
import StyleEditor from '@/components/StyleEditor.vue'

@Component ({
  components: {
    VirtualBookSectionRenderer,
    HypertextBlock,
    TableOfContents,
    Trash2Icon,
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
  @Prop() sectionPath?: number[];

  showingStyle = false;
  suggestedSelectors = [
    'p',
    'a',
    '.vbook-body',
    '.vbook-section',
  ];

  previewHTML = '';

  get targetContent(): VirtualBookContentReference | null {
    if(this.model && this.contentCriteria) {
      return VirtualBook.findContent(this.model, this.contentCriteria);
    }
    return null;
  }

  get sectionByIndicesURL(): string {
    const routes = this.$router.getRoutes();
    const route = routes.find(route => route.name === 'Show Section By Indices');
    if(route) {
      return `#${route.path.replace('/*', '')}`;
    }
    return '';
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
    console.log({request})
    /*if(this.path) {
      request.path = this.path.concat('content');
    }*/
    //this.$emit('change', request);
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
</style>
