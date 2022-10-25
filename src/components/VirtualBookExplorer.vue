<template>
  <div>
    <div
      v-if="model"
      class="vbook-explorer-body"
    >
      <ScopedStyleRenderer :rules="model.style"/>
      <TableOfContents
        v-if="model.sections.length || editing"
        :model="model"
        :editable="editing"
        @change="$emit('change', $event)"
      />
      <div
        v-if="model.sections.length"
        class="vbook-explorer-content-pane"
      >
        <div class="vbook-nav-bar">
          <span class="vbook-search-box">
            <input
              type="text"
              v-model="searchText"
              @keyup="onSearchKey($event)"
            />
            <button @click="runSearch()">
              <SearchIcon size="1x"/>
            </button>
          </span>
        </div>
        <div
          v-if="matchingContent.length > 1"
        >
          <div>Multiple Matches Found:</div>
          <div
            v-for="(item, index) of matchingContent"
            :key="index"
            class="vbook-search-result"
          >
            <BreadcrumbLinks :reference="item"/>
            <span v-if="item.value.title">
              <ChevronRightIcon size="1x"/>
              <VirtualBookContentLink
                :path="item.path"
                :target="item.value"
              />
            </span>
          </div>
        </div>
        <div
          v-else-if="matchingContent.length === 1"
        >
          <div class="vbook-breadcrumbs-bar">
            <BreadcrumbLinks :reference="targetContent"/>
          </div>
          <div class="vbook-body">
            <VirtualBookSectionRenderer
              v-if="targetContent.value"
              :source="model"
              :path="targetContent.path"
              :value="targetContent.value"
              :editable="editing"
              @change="$emit('change', $event)"
            />
            <VirtualBookSnippetRenderer
              v-else
              :source="model"
              :path="targetContent.path"
              :editable="editing"
              placeholder="Target Content"
              @change="$emit('change', $event)"
            />
          </div>
          <VirtualBookSectionsNavBar :reference="targetContent"/>
        </div>
        <div v-else>Content Not Found</div>
      </div>
      <div v-else>Book Is Empty</div>
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  EditIcon,
  Trash2Icon,
  CodeIcon,
  SearchIcon,
  ChevronRightIcon
} from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookContentSearchOptions,
  VirtualBookContentReference,
  PathStep,
} from '@/classes/VirtualBook'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'
import VirtualBookSnippetRenderer from '@/components/VirtualBookSnippetRenderer.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import BreadcrumbLinks from '@/components/BreadcrumbLinks.vue'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'
import VirtualBookSectionsNavBar from '@/components/VirtualBookSectionsNavBar.vue'
import VirtualBookExporter from '@/components/VirtualBookExporter.vue'
import VirtualBookImporter from '@/components/VirtualBookImporter.vue'
import ModalLayer from '@/components/ModalLayer.vue'
import ScopedStyleRenderer from '@/components/ScopedStyleRenderer.vue'
import StyleEditor from '@/components/StyleEditor.vue'

@Component ({
  components: {
    VirtualBookSectionRenderer,
    VirtualBookSnippetRenderer,
    TableOfContents,
    BreadcrumbLinks,
    VirtualBookContentLink,
    VirtualBookSectionsNavBar,
    EditIcon,
    Trash2Icon,
    CodeIcon,
    SearchIcon,
    ChevronRightIcon,
    VirtualBookExporter,
    VirtualBookImporter,
    ModalLayer,
    ScopedStyleRenderer,
    StyleEditor,
  }
})
export default class VirtualBookExplorer extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() searchOptions?: VirtualBookContentSearchOptions;

  searchText = '';

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

  get matchingContent(): VirtualBookContentReference[] | null {
    if(this.model && this.searchOptions) {
      const results = VirtualBook.searchBookContents(this.model, this.searchOptions);
      return results.map(
        result => VirtualBook.searchResultToReference(result, this.model as VirtualBook)
      );
    }
    return [];
  }

  get targetContent(): VirtualBookContentReference | null {
    return this.matchingContent?.length ? this.matchingContent[0] : null;
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

  onSearchKey(event: KeyboardEvent): void {
    if(event.key === 'Enter') {
      this.runSearch();
    }
  }

  runSearch(): void {
    this.$router.push({
      path: '/find',
      query: {
        term: this.searchText
      }
    });
  }
}
</script>

<style lang="stylus" scoped>
.vbook-explorer-body
  display flex
.vbook-explorer-content-pane
  width -webkit-fill-available
.vbook-nav-bar
  width -webkit-fill-available
  text-align right
.vbook-search-result
  background-color snow
  border 1px solid gray
  border-radius 4px
  margin-left 8px
.active-button
  background-color yellow
</style>
