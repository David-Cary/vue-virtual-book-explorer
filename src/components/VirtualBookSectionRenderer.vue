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
    <VirtualBookContentRenderer
      tag="div"
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
        <FolderPlusIcon
          v-if="editable"
          :key="'add-at-'+index"
          @click="onAddSubsection(targetSection.sections.length)"
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
      <FolderPlusIcon
        v-if="editable"
        @click="onAddSubsection(targetSection.sections.length)"
      />
    </div>
    <div
      v-if="editable"
      class="vbook-section-menu"
    >
      <FolderMinusIcon @click="onRemoveSection()"/>
    </div>
  </div>
  <div v-else>Section Not Found</div>
</template>

<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { get, clamp, cloneDeep } from 'lodash'
import { FolderMinusIcon, FolderPlusIcon } from 'vue-feather-icons'
import VirtualBook, { VirtualBookSection } from '@/classes/VirtualBook'
import { SetValueRequest, InsertValueRequest, DeleteValueRequest } from '@/classes/ObjectEditorEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import TextRenderer from '@/components/TextRenderer.vue'
import VirtualBookContentRenderer from '@/components/VirtualBookContentRenderer.vue'

@Component ({
  components: {
    TextRenderer,
    VirtualBookContentRenderer,
    FolderMinusIcon,
    FolderPlusIcon,
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

  get subsectionsPaneClass(): string {
    return this.sectionDepth > 6 ? 'indented' : '';
  }

  get subsectionClass(): string {
    return this.editable ? 'vbook-editor-subsections' : '';
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

  onAddSubsection(index: number): void {
    const request = new InsertValueRequest(
      this.fullPath.concat('sections', index),
      new VirtualBookSection()
    );
    this.$emit('change', request);
  }

  onRemoveSection(): void {
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
svg.feather-folder-plus
  cursor cell
svg.feather-folder-minus
  cursor pointer
</style>
