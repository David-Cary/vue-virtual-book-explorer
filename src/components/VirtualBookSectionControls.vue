<template>
  <span>
    <CopyIcon
      :class="copyIconClass"
      @click="onCopySection()"
    />
    <ScissorsIcon
      :class="cutIconClass"
      @click="onCutSection()"
    />
    <FolderMinusIcon @click="onRemoveSection()"/>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { cloneDeep } from 'lodash'
import { FolderMinusIcon, CopyIcon, ScissorsIcon } from 'vue-feather-icons'
import {
  VirtualBookSection,
  VirtualBookContentReference,
} from '@/classes/VirtualBook'
import { CommonKey } from '@/ts/utilities/TraversalState'
import { DeleteValueRequest } from '@/classes/ObjectEditorEngine'

@Component ({
  components: {
    FolderMinusIcon,
    CopyIcon,
    ScissorsIcon,
  }
})
export default class VirtualBookSectionControls extends Vue {
  @Prop() value?: VirtualBookContentReference;

  get section(): VirtualBookSection | null {
    return this.value?.section.value || null;
  }

  get path(): CommonKey[] {
    return this.value?.propertyPath || [];
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

  get copiedSection(): VirtualBookSection | undefined {
    const value = this.$store.state.clipboard?.source;
    if(typeof value === 'object' && value?.content) {
      return value as VirtualBookSection;
    }
    return undefined;
  }

  onCopySection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.section,
          }
    );
  }

  onCutSection(): void {
    this.$store.commit(
      'updateClipboard',
      this.isCopied
        ? null
        : {
            source: this.section,
            remove: true,
          }
    );
  }

  onRemoveSection(): void {
    if(this.section?.content.length || this.section?.sections.length) {
      const confirmed = confirm("Are you sure you want to delete this section and all it's content?");
      if(!confirmed) return;
    }
    const request = new DeleteValueRequest(
      this.path,
      cloneDeep(this.section)
    );
    this.$emit('change', request);
  }
}
</script>
<style lang="stylus" scoped>
svg.feather-folder-minus
  cursor pointer
svg.feather-copy
  cursor pointer
svg.feather-scissors
  cursor pointer
.active-icon
  background-color yellow
</style>
