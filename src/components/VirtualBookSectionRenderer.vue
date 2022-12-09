<template>
  <div
    v-if="section"
    class="vbook-section"
  >
    <IdField
      v-if="editable"
      :usedIds="contentIds"
      :value="section.id"
      placeholder="Section Id"
      @change="onIdChange($event)"
    />
    <TextRenderer
      :tag="headerTag"
      :value="section.title"
      :editable="editable"
      placeholder="Section Title"
      @change="onTitleChange($event)"
    />
    <HypertextContentEditor
      :sourceData="sourceData"
      :content="section.content"
      :editable="editable"
      placeholder="Section Content"
      @change="onContentChange($event)"
    />
    <div
      v-if="subsections"
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
          v-for="(section, index) in subsections"
        >
          <VirtualBookSectionInjector
            v-if="editable"
            :key="'add-at-'+index"
            :parentRef="value"
            :index="index"
            @change="$emit('change', $event)"
          />
          <VirtualBookSectionRenderer
            v-if="sectionDisplay === 'full'"
            :sourceData="sourceData"
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
            <VirtualBookContentLink :contentRef="section"/>
            &nbsp;
            <VirtualBookSectionControls
              v-if="editable"
              :value="section"
              @change="$emit('change', $event)"
            />
          </div>
        </template>
        <VirtualBookSectionInjector
          v-if="editable"
          :parentRef="value"
          :index="value.section.value.sections.length"
          @change="$emit('change', $event)"
        />
      </div>
    </div>
    <VirtualBookSectionControls
      v-if="editable"
      class="vbook-section-menu"
      :value="value"
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
import {
  VirtualBookContentReference,
  VirtualBookSection,
  VirtualBookDataCache,
} from '@/ts/data/VirtualBook'
import { CommonKey } from '@/ts/utilities/TraversalState'
import { SetValueRequest } from '@/ts/data/ObjectEditorEngine'
import ValueChangeDescription from '@/ts/data/ValueChangeDescription'
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
  @Prop() value?: VirtualBookContentReference;
  @Prop() sourceData?: VirtualBookDataCache;
  @Prop() editable?: boolean;

  get contentIds(): string[] {
    return this.sourceData?.contentIds || [];
  }

  get section(): VirtualBookSection | null {
    return this.value?.section.value || null;
  }

  get subsections(): VirtualBookContentReference[] | null {
    return this.value?.subsections || null;
  }

  get sectionDepth(): number {
    return this.value?.section.state.descent.length || 0;
  }

  get path(): CommonKey[] {
    return this.value?.propertyPath || [];
  }

  defaultSectionDisplay = 'full';

  get sectionDisplay(): string {
    return this.section?.sectionDisplay || this.defaultSectionDisplay;
  }

  setSectionDisplay(value: string): void {
    const request = new SetValueRequest({
      value: value !== this.defaultSectionDisplay ? value : undefined,
      previousValue: this.section?.sectionDisplay,
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
    return this.copiedSection === this.section;
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
