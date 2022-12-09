<template>
  <span>
    <span
      v-for="(item, index) of contentAncestry"
      :key="index"
    >
      <ChevronRightIcon size="1x"/>
      <VirtualBookContentLink
        :contentRef="item"
        :linkByPath="linkByPath"
      />
    </span>
    <span v-if="showContentLink">
      <ChevronRightIcon size="1x"/>
      <VirtualBookContentLink
        :contentRef="currentContent"
        :linkByPath="linkByPath"
      />
    </span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronRightIcon } from 'vue-feather-icons'
import { VirtualBookContentReference } from '@/ts/data/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class BreadcrumbLinks extends Vue {
  @Prop() currentContent?: VirtualBookContentReference;
  @Prop() showContentLink?: boolean;
  @Prop() linkByPath?: boolean;

  get contentAncestry(): VirtualBookContentReference[] {
    return this.currentContent?.sectionAncestry || [];
  }
}
</script>
<style lang="stylus" scoped>
svg
  vertical-align text-bottom
</style>
