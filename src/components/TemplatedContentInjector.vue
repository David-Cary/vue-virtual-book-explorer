<template>
  <span class>
    <button @click="onAddContent()">
      <PlusIcon size="1x"/>
    </button>
    <select v-model="selectedId">
      <option
        v-for="(id, index) in idOptions"
        :key="index"
      >{{id}}</option>
    </select>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { PlusIcon } from 'vue-feather-icons'
import { JSONContent } from '@tiptap/core'
import { Editor } from '@tiptap/vue-2'

@Component ({
  components: {
    PlusIcon,
  }
})
export default class TemplatedContentInjector extends Vue {
  @Prop() editor?: Editor;
  @Prop() templates?: Record<string, JSONContent>;
  @Prop() availableIds?: string[];

  get idOptions(): string[] {
    if(this.availableIds) {
      return this.availableIds;
    }
    return this.templates ? Object.keys(this.templates) : [];
  }

  selectedId = '';

  created(): void {
    if(this.idOptions.length) {
      this.selectedId = this.idOptions[0];
    }
  }

  onAddContent(): void {
    if(this.editor && this.templates) {
      const template = this.templates[this.selectedId];
      if(template) {
        const pos = this.editor.state.selection.$from.pos;
        this.editor
          .chain()
          .focus()
          .insertFromTemplate(pos, template)
          .run();
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
