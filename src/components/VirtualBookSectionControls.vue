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
import { VirtualBookSection, PathStep } from '@/classes/VirtualBook'
import { DeleteValueRequest } from '@/classes/ObjectEditorEngine'

@Component ({
  components: {
    FolderMinusIcon,
    CopyIcon,
    ScissorsIcon,
  }
})
export default class VirtualBookSectionControls extends Vue {
  @Prop() value?: VirtualBookSection;
  @Prop() path?: PathStep[];

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
