<template>
  <VirtualBookExplorer
    :model="book"
    :sectionPath="[0]"
    @change="onChangeRequest($event)"
  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VirtualBookExplorer from '@/components/VirtualBookExplorer.vue'
import VirtualBook from '@/classes/VirtualBook'
import { OperationRequest } from '@/classes/OperationEngine'

@Component({
  components: {
    VirtualBookExplorer,
  },
})
export default class Home extends Vue {
  get book(): VirtualBook {
    return this.$store.state.book;
  }

  onChangeRequest(request: OperationRequest): void {
    this.$store.commit('updateBook', request);
  }
}
</script>
