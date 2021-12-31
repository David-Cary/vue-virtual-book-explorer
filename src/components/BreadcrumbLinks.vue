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
import {
  VirtualBookContentReference,
  VirtualBookSection,
} from '@/classes/VirtualBook'
import VirtualBookContentLink from '@/components/VirtualBookContentLink.vue'

@Component ({
  components: {
    ChevronRightIcon,
    VirtualBookContentLink,
  }
})
export default class BreadcrumbLinks extends Vue {
  @Prop() reference?: VirtualBookContentReference;

  get pathingError(): string | null {
    if(this.reference) {
      return this.reference.path ? null : 'No content path provided.';
    }
    return 'No reference provided.';
  }

  get linkData(): VirtualBookContentReference[] {
    const results: VirtualBookContentReference[] = [];
    if(this.reference && this.reference.path) {
      const fullPath = this.reference.path;
      const parentLength = fullPath.length - 2;
      let targetSection: VirtualBookSection | undefined = undefined;
      for(let i = 0; i < parentLength; i += 2) {
        const collectionName = fullPath[i];
        if(collectionName === 'sections') {
          const sectionIndex = Number(fullPath[i + 1]);
          if(targetSection) {
            targetSection = targetSection.sections[sectionIndex];
          } else if(this.reference.source) {
            targetSection = this.reference.source.sections[sectionIndex];
          }
          results.push({
            path: fullPath.slice(0, i + 2),
            value: targetSection,
          });
        } else break;
      }
    }
    return results;
  }
}
</script>
<style lang="stylus" scoped>
svg
  vertical-align text-bottom
</style>
