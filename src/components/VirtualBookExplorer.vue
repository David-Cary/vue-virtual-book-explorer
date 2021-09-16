<template>
  <div
    v-if="model"
    class="vbook-explorer"
  >
    <TableOfContents
      :model="model"
      :editable="true"
      baseURL="#/view"
      @change="$emit('change', $event)"
    />
    <VirtualBookSectionRenderer
      :source="model"
      :sectionPath="sectionPath"
      :editable="true"
      @change="$emit('change', $event)"
    />
  </div>
  <div v-else>Book Not Found</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VirtualBook from '@/classes/VirtualBook'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'
import TableOfContents from '@/components/TableOfContents.vue'

@Component ({
  components: {
    VirtualBookSectionRenderer,
    TableOfContents,
  }
})
export default class VirtualBookExplorer extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() sectionPath?: number[];
}
</script>
<style lang="stylus" scoped>
.vbook-explorer
  display flex
</style>
