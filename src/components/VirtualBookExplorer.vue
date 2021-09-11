<template>
  <div v-if="model">
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

@Component ({
  components: {
    VirtualBookSectionRenderer,
  }
})
export default class VirtualBookExplorer extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() sectionPath?: number[];
}
</script>
