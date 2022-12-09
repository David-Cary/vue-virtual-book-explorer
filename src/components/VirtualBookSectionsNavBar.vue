<template>
  <div class="vbook-section-nav-bar">
    <div v-if="previousSection">
      <ChevronLeftIcon size="1x"/>
      <VirtualBookContentLink :contentRef="previousSection"/>
    </div>
    <div v-if="nextSection">
      <VirtualBookContentLink :contentRef="nextSection"/>
      <ChevronRightIcon size="1x"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronLeftIcon, ChevronRightIcon } from 'vue-feather-icons'
import { VirtualBookContentReference } from '@/ts/data/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class VirtualBookSectionsNavBar extends Vue {
  @Prop() currentContent?: VirtualBookContentReference;

  get nextSection(): VirtualBookContentReference | null {
    return this.currentContent?.nextSection || null;
  }

  get previousSection(): VirtualBookContentReference | null {
    return this.currentContent?.previousSection || null;
  }
}
</script>
<style lang="stylus" scoped>
.vbook-section-nav-bar
  display flex
  justify-content space-between
svg
  vertical-align text-bottom
</style>
