<template>
  <div
    v-if="value"
    class="vbook-section"
  >
    <IdField
      v-if="editable"
      :source="source"
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
    <HypertextBlock
      :context="source"
      :content="value.content"
      :editable="editable"
      placeholder="Section Content"
      @change="onContentChange($event)"
    />
    <div
      v-if="value.sections"
      :class="subsectionsPaneClass"
    >
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
          :source="source"
          :path="path.concat('sections', index)"
          :editable="editable"
          :key="index"
          :class="subsectionClass"
          @change="$emit('change',$event)"
        />
      </template>
      <VirtualBookSectionInjector
        v-if="editable"
        :source="source"
        :basePath="path"
        :index="value.sections.length"
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
import { clamp, cloneDeep } from 'lodash'
import { FolderMinusIcon, CopyIcon, ScissorsIcon } from 'vue-feather-icons'
import VirtualBook, { VirtualBookSection, PathStep } from '@/classes/VirtualBook'
import { SetValueRequest, DeleteValueRequest } from '@/classes/ObjectEditorEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import IdField from '@/components/IdField.vue'
import TextRenderer from '@/components/TextRenderer.vue'
import HypertextBlock from '@/components/HypertextBlock.vue'
import VirtualBookSectionInjector from '@/components/VirtualBookSectionInjector.vue'

@Component ({
  components: {
    TextRenderer,
    IdField,
    HypertextBlock,
    VirtualBookSectionInjector,
    FolderMinusIcon,
    CopyIcon,
    ScissorsIcon,
  }
})
export default class VirtualBookSectionRenderer extends Vue {
  @Prop() value?: VirtualBookSection;
  @Prop() source?: VirtualBook;
  @Prop() path?: PathStep[];
  @Prop() editable?: boolean;

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

  onCopySection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.value,
          }
    );
  }

  onCutSection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.value,
            remove: true,
          }
    );
  }

  onRemoveSection(): void {
    if(this.value?.content.length || this.value?.sections.length) {
      const confirmed = confirm("Are you sure you want to delete this section and all it's content?");
      if(!confirmed) return;
    }
    const request = new DeleteValueRequest(
      this.path,
      cloneDeep(this.value)
    );
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
