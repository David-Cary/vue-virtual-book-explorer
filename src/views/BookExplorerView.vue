<template>
  <VirtualBookExplorer
    :model="book"
    :searchOptions="searchOptions"
    @change="onChangeRequest($event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VirtualBookExplorer from '@/components/VirtualBookExplorer.vue'
import VirtualBook, {
  VirtualBookContentSearchOptions,
} from '@/ts/data/VirtualBook'
import { OperationRequest } from '@/ts/data/OperationEngine'

@Component({
  components: {
    VirtualBookExplorer,
  },
})
export default class BookExplorerView extends Vue {
  @Prop() searchOptions?: VirtualBookContentSearchOptions;

  book: VirtualBook | null = null;

  refreshBook(): void {
    this.book = new VirtualBook(this.$store.state.book);
  }

  created(): void {
    this.refreshBook();
  }

  onChangeRequest(request: OperationRequest): void {
    this.$store.commit('updateBook', request);
    this.refreshBook();
  }
}
</script>
