<template>
  <div>
    <div
      v-if="model"
      class="vbook-explorer-body"
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
    <div>
      <button @click="onClickRevert()">
        <Trash2Icon size="1x"/>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Trash2Icon } from 'vue-feather-icons'
import VirtualBook from '@/classes/VirtualBook'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import VirtualBookSectionRenderer from '@/components/VirtualBookSectionRenderer.vue'
import TableOfContents from '@/components/TableOfContents.vue'

@Component ({
  components: {
    VirtualBookSectionRenderer,
    TableOfContents,
    Trash2Icon,
  }
})
export default class VirtualBookExplorer extends Vue {
  @Prop() model?: VirtualBook;
  @Prop() sectionPath?: number[];

  onClickRevert(): void {
    const confirmed = window.confirm('All changes will be lost. Are you sure?');
    if(confirmed) {
      this.$emit(
        'change',
        new SetValueRequest({
          value: new VirtualBook(),
          previousValue: this.model,
        })
      );
    }
  }
}
</script>
<style lang="stylus" scoped>
.vbook-explorer-body
  display flex
</style>
