<template>
  <div v-if="model">
    <div class="vbook-table-of-contents-header">
      <div v-if="model.sections && model.sections.length">
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
        <VirtualBookContentLink
          :target="model"
          :path="path"
        />
      </div>
    </div>
    <div v-if="isOpen">
      <TableOfContentsSection
        v-for="(section, index) of model.sections"
        :key="index"
        class="vbook-table-of-contents-subsections"
        :model="section"
        :basePath="path"
        :index="index"
      />
    </div>
  </div>
  <div v-else>Section Not Found</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronRightIcon, ChevronDownIcon } from 'vue-feather-icons'
import { VirtualBookSection, PathStep } from '@/classes/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronDownIcon,
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class TableOfContentsSection extends Vue {
  @Prop() model?: VirtualBookSection;
  @Prop() basePath?: PathStep[];
  @Prop() index?: number;

  isOpen = false;

  get path(): PathStep[] {
    const base: PathStep[] = this.basePath ? this.basePath : [];
    if(this.index !== undefined) {
      return base.concat('sections', this.index);
    }
    return base;
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
