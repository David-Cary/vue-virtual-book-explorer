<template>
  <div v-if="sectionRef">
    <div class="vbook-table-of-contents-header">
      <div v-if="sectionRef.section.value.sections.length">
        <ChevronDownIcon
          v-if="isOpen"
          @click="isOpen = false"
        />
        <ChevronRightIcon
          v-else
          @click="isOpen = true"
        />
      </div>
      <div v-else>&nbsp;</div>
      <div>
        <VirtualBookContentLink :contentRef="sectionRef"/>
      </div>
    </div>
    <div v-if="isOpen">
      <TableOfContentsSection
        v-for="(section, index) of subsections"
        :key="index"
        class="vbook-table-of-contents-subsections"
        :parentRef="sectionRef"
        :index="index"
      />
    </div>
  </div>
  <div v-else>Section Not Found</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronRightIcon, ChevronDownIcon } from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookContentReference
} from '@/ts/data/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronDownIcon,
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class TableOfContentsSection extends Vue {
  @Prop() book?: VirtualBook;
  @Prop() parentRef?: VirtualBookContentReference;
  @Prop() index?: number;

  isOpen = false;

  get sectionRef(): VirtualBookContentReference | null {
    if(this.index !== undefined) {
      if(this.parentRef) {
        return this.parentRef.getSubsection(this.index);
      }
      if(this.book) {
        return this.book.getSection(this.index);
      }
    }
    return null;
  }

  get subsections(): VirtualBookContentReference[] {
    return this.sectionRef?.subsections || [];
  }
}
</script>
<style lang="stylus" scoped>
.vbook-table-of-contents-header
  display flex
  align-items center
  width max-content
  padding-right 4px
.vbook-table-of-contents-subsections
  margin-left 8px
svg
  vertical-align bottom
</style>
