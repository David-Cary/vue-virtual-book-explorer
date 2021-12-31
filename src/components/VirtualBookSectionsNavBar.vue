<template>
  <div class="vbook-section-nav-bar">
    <div v-if="previousSection">
      <ChevronLeftIcon size="1x"/>
      <VirtualBookContentLink
        :path="previousSection.path"
        :target="previousSection.value"
      />
    </div>
    <div v-if="nextSection">
      <VirtualBookContentLink
        :path="nextSection.path"
        :target="nextSection.value"
      />
      <ChevronRightIcon size="1x"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ChevronLeftIcon, ChevronRightIcon } from 'vue-feather-icons'
import VirtualBook, {
  VirtualBookContentReference,
} from '@/classes/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronLeftIcon,
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class VirtualBookSectionsNavBar extends Vue {
  @Prop() reference?: VirtualBookContentReference;

  get nextSection(): VirtualBookContentReference | null {
    if(this.reference) {
      return VirtualBook.getNextSection(this.reference);
    }
    return null;
  }

  get previousSection(): VirtualBookContentReference | null {
    if(this.reference) {
      return VirtualBook.getPreviousSection(this.reference);
    }
    return null;
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
