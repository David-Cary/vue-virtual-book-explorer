<template>
  <div
    v-if="value"
    class="vbook-section"
  >
    <IdField
      v-if="editable"
      :usedIds="sourceData.contentById.keys"
      :value="value.id"
      placeholder="Section Id"
      @change="onIdChange($event)"
    />
    <TextRenderer
      :tag="headerTag"
      :value="value.title"
      :editable="editable"
      placeholder="Section Title"
      @change="onTitleChange($event)"
    />
    <HypertextContentEditor
      :context="source"
      :cachedContextData="sourceData"
      :content="value.content"
      :editable="editable"
      placeholder="Section Content"
      @change="onContentChange($event)"
    />
    <div
      v-if="value.sections"
      :class="subsectionsPaneClass"
    >
      <div v-if="editable">
        <select
          :value="sectionDisplay"
          @change="setSectionDisplay($event.target.value)"
        >
          <option value='full'>Show Subsections</option>
          <option value='linked'>Show Subsection Links</option>
          <option value='separate'>Separate Subsections</option>
        </select>
      </div>
      <div :class="sectionDisplayClass">
        <template
          v-for="(section, index) in value.sections"
        >
          <VirtualBookSectionInjector
            v-if="editable"
            :key="'add-at-'+index"
            :source="source"
            :basePath="path"
            :index="index"
            @change="$emit('change', $event)"
          />
          <VirtualBookSectionRenderer
            v-if="sectionDisplay === 'full'"
            :source="source"
            :cachedSourceData="sourceData"
            :path="path.concat('sections', index)"
            :value="section"
            :editable="editable"
            :key="index"
            :class="subsectionClass"
            @change="$emit('change',$event)"
          />
          <div
            v-else-if="editable || sectionDisplay !== 'separate'"
            :key="index"
          >
            <VirtualBookContentLink
              :target="section"
              :path="path.concat('sections', index)"
            />
            &nbsp;
            <VirtualBookSectionControls
              v-if="editable"
              :value="section"
              :path="path.concat('sections', index)"
              @change="$emit('change', $event)"
            />
          </div>
        </template>
        <VirtualBookSectionInjector
          v-if="editable"
          :source="source"
          :basePath="path"
          :index="value.sections.length"
          @change="$emit('change', $event)"
        />
      </div>
    </div>
    <VirtualBookSectionControls
      v-if="editable"
      class="vbook-section-menu"
      :value="value"
      :path="path"
      @change="$emit('change', $event)"
    />
  </div>
  <div v-else>
    <span>Section Not Found</span>
  </div>
</template>

<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { clamp } from 'lodash'
import VirtualBook, {
  VirtualBookSection,
  PathStep,
  VirtualBookDerivedData,
} from '@/classes/VirtualBook'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import IdField from '@/components/IdField.vue'
import TextRenderer from '@/components/TextRenderer.vue'
import HypertextContentEditor from '@/components/HypertextContentEditor.vue'
import VirtualBookSectionControls from '@/components/VirtualBookSectionControls.vue'
import VirtualBookSectionInjector from '@/components/VirtualBookSectionInjector.vue'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    TextRenderer,
    IdField,
    HypertextContentEditor,
    VirtualBookSectionControls,
    VirtualBookSectionInjector,
    VirtualBookContentLink,
  }
})
export default class VirtualBookSectionRenderer extends Vue {
  @Prop() value?: VirtualBookSection;
  @Prop() source?: VirtualBook;
  @Prop() cachedSourceData?: VirtualBookDerivedData;
  @Prop() path?: PathStep[];
  @Prop() editable?: boolean;

  get sourceData(): VirtualBookDerivedData | null {
    return this.cachedSourceData
      || this.source?.derivedData
      || null;
  }

  get contentIds(): string[] {
    return this.sourceData?.contentById.keys || [];
  }

  get sectionDepth(): number {
    let count = 0;
    if(this.path) {
      for(const step of this.path) {
        if(step === 'sections') {
          count++
        }
      }
    }
    return count;
  }

  defaultSectionDisplay = 'full';

  get sectionDisplay(): string {
    return this.value && this.value.sectionDisplay
      ? this.value.sectionDisplay
      : this.defaultSectionDisplay;
  }

  setSectionDisplay(value: string): void {
    const request = new SetValueRequest({
      value: value !== this.defaultSectionDisplay ? value : undefined,
      previousValue: this.value ? this.value.sectionDisplay : undefined,
      path: this.path ? this.path.concat('sectionDisplay') : undefined,
    });
    this.$emit('change', request);
  }

  get sectionDisplayClass(): string {
    return `vbook-${this.sectionDisplay}-section-display`;
  }

  get headerTag(): string {
    return `h${clamp(this.sectionDepth, 1, 6)}`;
  }

  get isCopied(): boolean {
    return this.copiedSection === this.value;
  }

  get copyIconClass(): string {
    if(this.isCopied) {
      return this.$store.state.clipboard?.remove ? '' : 'active-icon';
    }
    return '';
  }

  get cutIconClass(): string {
    if(this.isCopied) {
      return this.$store.state.clipboard?.remove ? 'active-icon' : '';
    }
    return '';
  }

  get subsectionsPaneClass(): string {
    return this.sectionDepth > 6 ? 'indented' : '';
  }

  get subsectionClass(): string {
    return this.editable ? 'vbook-editor-subsections' : '';
  }

  get copiedSection(): VirtualBookSection | undefined {
    const value = this.$store.state.clipboard?.source;
    if(typeof value === 'object' && value?.content) {
      return value as VirtualBookSection;
    }
    return undefined;
  }

  onTitleChange(change: ValueChangeDescription<string>): void {
    const request = new SetValueRequest(change);
    if(this.path) {
      request.path = this.path.concat('title');
    }
    this.$emit('change', request);
  }

  onContentChange(change: ValueChangeDescription<VNode[]>): void {
    const request = new SetValueRequest(change);
    if(this.path) {
      request.path = this.path.concat('content');
    }
    this.$emit('change', request);
  }

  onIdChange(change: ValueChangeDescription<string>): void {
    const request = new SetValueRequest(change);
    if(this.path) {
      request.path = this.path.concat('id');
    }
    this.$emit('change', request);
  }
}
</script>
<style lang="stylus" scoped>
.vbook-section
  position relative
  width -webkit-fill-available
.vbook-editor-subsections
  border 1px dashed rgba(0,0,0,0.5)
  border-radius 4px
  margin-left 4px
  padding-left 4px
.vbook-section-menu
  position absolute
  top 0px
  right 0px
.vbook-separate-section-display
  opacity 50%
.indented
  margin-left 8px
.active-icon
  background-color yellow
</style>
