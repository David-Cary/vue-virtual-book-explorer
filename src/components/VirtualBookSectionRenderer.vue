<template>
  <div
    v-if="targetSection"
    class="vbook-section"
  >
    <TextRenderer
      :tag="headerTag"
      :value="targetSection.title"
      :editable="editable"
      placeholder="Section Title"
      @change="onTitleChange($event)"
    />
    <HypertextBlock
      :value="targetSection.contents"
      :editable="editable"
      placeholder="Section Contents"
      @change="onContentChange($event)"
    />
    <div
      v-if="targetSection.sections"
      :class="subsectionsPaneClass"
    >
      <template
        v-for="(section, index) in targetSection.sections"
      >
        <VirtualBookSectionInjector
          v-if="editable"
          :key="'add-at-'+index"
          :source="source"
          :basePath="fullPath"
          :index="index"
          @change="$emit('change', $event)"
        />
        <VirtualBookSectionRenderer
          :source="source"
          :sectionPath="sectionPath.concat(index)"
          :editable="editable"
          :key="index"
          :class="subsectionClass"
          @change="$emit('change',$event)"
        />
      </template>
      <VirtualBookSectionInjector
        v-if="editable"
        :source="source"
        :basePath="fullPath"
        :index="targetSection.sections.length"
        @change="$emit('change', $event)"
      />
    </div>
    <div
      v-if="editable"
      class="vbook-section-menu"
    >
      <CopyIcon
        :class="copyIconClass"
        @click="onCopySection()"
      />
      <ScissorsIcon
        :class="cutIconClass"
        @click="onCutSection()"
      />
      <FolderMinusIcon @click="onRemoveSection()"/>
    </div>
  </div>
  <div v-else>
    <span>Section Not Found</span>
  </div>
</template>

<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { get, clamp, cloneDeep } from 'lodash'
import { FolderMinusIcon, CopyIcon, ScissorsIcon } from 'vue-feather-icons'
import VirtualBook, { VirtualBookSection } from '@/classes/VirtualBook'
import { SetValueRequest, DeleteValueRequest } from '@/classes/ObjectEditorEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import TextRenderer from '@/components/TextRenderer.vue'
import HypertextBlock from '@/components/HypertextBlock.vue'
import VirtualBookSectionInjector from '@/components/VirtualBookSectionInjector.vue'

@Component ({
  components: {
    TextRenderer,
    HypertextBlock,
    VirtualBookSectionInjector,
    FolderMinusIcon,
    CopyIcon,
    ScissorsIcon,
  }
})
export default class VirtualBookSectionRenderer extends Vue {
  @Prop() source?: VirtualBook;
  @Prop() sectionPath?: number[];
  @Prop() editable?: boolean;

  get fullPath(): (string|number)[] {
    const path = [];
    if(this.sectionPath) {
      for(const step of this.sectionPath) {
        path.push('sections', step);
      }
    }
    return path;
  }

  get targetSection(): VirtualBookSection | null {
    return get(this.source, this.fullPath);
  }

  get sectionDepth(): number {
    return this.sectionPath ? this.sectionPath.length : 0;
  }

  get headerTag(): string {
    return `h${clamp(this.sectionDepth, 1, 6)}`;
  }

  get isCopied(): boolean {
    return this.copiedSection === this.targetSection;
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
    if(typeof value === 'object' && value?.contents) {
      return value as VirtualBookSection;
    }
    return undefined;
  }

  onTitleChange(change: ValueChangeDescription<string>): void {
    const request = new SetValueRequest(change);
    request.path = this.fullPath.concat('title');
    this.$emit('change', request);
  }

  onContentChange(change: ValueChangeDescription<VNode[]>): void {
    const request = new SetValueRequest(change);
    request.path = this.fullPath.concat('contents');
    this.$emit('change', request);
  }

  onCopySection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.targetSection,
          }
    );
  }

  onCutSection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.targetSection,
            remove: true,
          }
    );
  }

  onRemoveSection(): void {
    if(this.targetSection?.contents.length || this.targetSection?.sections.length) {
      const confirmed = confirm("Are you sure you want to delete this section and all it's contents?");
      if(!confirmed) return;
    }
    const request = new DeleteValueRequest(
      this.fullPath,
      cloneDeep(this.targetSection)
    );
    this.$emit('change', request);
  }
}
</script>
<style lang="stylus" scoped>
.vbook-section
  position relative
  padding-left 4px
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
.indented
  margin-left 8px
svg.feather-folder-minus
  cursor pointer
svg.feather-copy
  cursor pointer
svg.feather-scissors
  cursor pointer
.active-icon
  background-color yellow
</style>
