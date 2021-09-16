<template>
  <div v-if="model">
    <div class="vbook-table-of-contents-header">
      <div v-if="model.sections.length">
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
        <a :href="sectionURL">{{activeTitle}}</a>
      </div>
    </div>
    <div v-if="isOpen">
      <TableOfContentsSection
        v-for="(section, index) of model.sections"
        :key="index"
        class="vbook-table-of-contents-subsections"
        :model="section"
        :index="index"
        :baseURL="sectionURL"
      />
    </div>
  </div>
  <div v-else>Section Not Found</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronRightIcon, ChevronDownIcon } from 'vue-feather-icons'
import { VirtualBookSection } from '@/classes/VirtualBook'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'

@Component ({
  components: {
    ChevronDownIcon,
    ChevronRightIcon,
    VirtualBookSectionRenderer,
  }
})
export default class TableOfContentsSection extends Vue {
  @Prop() model?: VirtualBookSection;
  @Prop() index?: number;
  @Prop() baseURL?: string;

  isOpen = false;

  get activeTitle(): string {
    if(this.model?.title) {
      return this.model.title;
    }
    if(this.index !== undefined) {
      return `Section ${this.index + 1}`;
    }
    return '';
  }

  get sectionURL(): string {
    if(this.baseURL) {
      return `${this.baseURL}/${this.index}`;
    }
    return '';
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
