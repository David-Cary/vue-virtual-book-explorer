<template>
  <div
    v-if="model"
    class="vbook-table-of-contents"
  >
    <template
      v-for="(section, index) in model.sections"
    >
      <VirtualBookSectionInjector
        v-if="editable"
        :key="'add-at-'+index"
        :source="model"
        :index="index"
        @change="$emit('change', $event)"
      />
      <TableOfContentsSection
        :key="index"
        :model="section"
        :index="index"
        :baseURL="baseURL"
      />
    </template>
    <VirtualBookSectionInjector
      v-if="editable"
      :source="model"
      :index="model.sections.length"
      @change="$emit('change', $event)"
    />
  </div>
  <div v-else>Book Not Found</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VirtualBook from '@/classes/VirtualBook'
import TableOfContentsSection from '@/components/TableOfContentsSection.vue'
import VirtualBookSectionInjector from '@/components/VirtualBookSectionInjector.vue'

@Component ({
  components: {
    TableOfContentsSection,
    VirtualBookSectionInjector,
  }
})
export default class TableOfContents extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() baseURL?: string;
  @Prop() editable?: boolean;
}
</script>
<style lang="stylus" scoped>
.vbook-table-of-contents
  border 2px solid black
  height fit-content
</style>
