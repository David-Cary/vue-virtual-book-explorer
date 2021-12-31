<template>
  <span>
    <span
      v-for="(link, index) of linkData"
      :key="index"
    >
      <ChevronRightIcon v-if="index" size="1x"/>
      <VirtualBookContentLink
        :path="link.path"
        :target="link.value"
      />
    </span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronRightIcon } from 'vue-feather-icons'
import VirtualBook, { VirtualBookContentReference } from '@/classes/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class BreadcrumbLinks extends Vue {
  @Prop() reference?: VirtualBookContentReference;

  get linkData(): VirtualBookContentReference[] {
    if(this.reference) {
      const stack = VirtualBook.getContentReferenceStack(this.reference);
      return stack.slice(0, stack.length - 1);
    }
    return [];
  }
}
</script>
<style lang="stylus" scoped>
svg
  vertical-align text-bottom
</style>
