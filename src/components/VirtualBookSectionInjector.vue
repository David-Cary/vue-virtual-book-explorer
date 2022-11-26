<template>
  <div class="vbook-section-injector">
    <FolderPlusIcon
      @click="onAddSubsection(index)"
    />
    <span
      v-if="copiedSection"
      class="add-from-clipboard"
      @click="onPasteSubsection(index)"
    >
      <ClipboardIcon/>
      <PlusIcon class="mini-plus" size="1x"/>
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { FolderPlusIcon, ClipboardIcon, PlusIcon } from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookSection,
  VirtualBookContentReference,
} from '@/classes/VirtualBook'
import { InsertValueRequest, DeleteValueRequest } from '@/classes/ObjectEditorEngine'
import { CommonKey } from '@/ts/utilities/TraversalState';

@Component ({
  components: {
    FolderPlusIcon,
    ClipboardIcon,
    PlusIcon,
  }
})
export default class VirtualBookSectionInjector extends Vue {
  @Prop() book?: VirtualBook;
  @Prop() parentRef?: VirtualBookContentReference;
  @Prop() index?: number;

  get copiedSection(): VirtualBookSection | undefined {
    const value = this.$store.state.clipboard?.source;
    if(typeof value === 'object' && value?.content) {
      return value as VirtualBookSection;
    }
    return undefined;
  }

  get injectionPath(): CommonKey[] {
    const basePath: CommonKey[] = this.parentRef?.propertyPath || [];
    const index = this.index !== undefined ? this.index : 0;
    return basePath.concat('sections',  index);
  }

  onAddSubsection(): void {
    const request = new InsertValueRequest(
      this.injectionPath,
      new VirtualBookSection()
    );
    this.$emit('change', request);
  }

  onPasteSubsection(): void {
    // Add clipboard content.
    if(this.copiedSection) {
      const request = new InsertValueRequest(
        this.injectionPath,
        VirtualBookSection.cloneSection(this.copiedSection)
      );
      this.$emit('change', request);
    }
    // Check for if the content should be removed from it's origin.
    if(this.$store.state.clipboard?.remove) {
      const book = this.parentRef?.section.state.root || this.book;
      if(book && this.copiedSection) {
        const removalPath = VirtualBook.getPathToSection(
          book,
          this.copiedSection
        );
        if(removalPath) {
          this.$emit('change', new DeleteValueRequest(
            removalPath,
            this.copiedSection
          ));
        }
      }
      // Clear the clipboard.
      this.$store.commit('updateClipboard', null);
    }
  }
}
</script>
<style lang="stylus" scoped>
.vbook-section-injector
  width max-content
svg.feather-folder-plus
  cursor cell
.add-from-clipboard
  cursor copy
  position relative
.mini-plus
  position absolute
  top -4px
  left 4px
</style>
