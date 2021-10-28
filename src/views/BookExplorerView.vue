<template>
  <VirtualBookExplorer
    :model="book"
    :contentCriteria="contentCriteria"
    @change="onChangeRequest($event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VirtualBookExplorer from '@/components/VirtualBookExplorer.vue'
import VirtualBook, {
  VirtualBookContentSearchCriteria
} from '@/classes/VirtualBook'
import { OperationRequest } from '@/classes/OperationEngine'

@Component({
  components: {
    VirtualBookExplorer,
  },
})
export default class BookExplorerView extends Vue {
  @Prop() contentCriteria?: VirtualBookContentSearchCriteria;

  get book(): VirtualBook {
    return this.$store.state.book;
  }

  onChangeRequest(request: OperationRequest): void {
    this.$store.commit('updateBook', request);
  }
}
</script>
