<template>
  <div v-if="target">
    <div>
      <IdField
        :source="context"
        placeholder="Id"
        :value="target.attrs.id"
        @change="setAttribute('id', $event.value)"
      />
    </div>
    <div>
      <input
        type="text"
        placeholder="Classes"
        :value="target.attrs.class"
        @change="setAttribute('class', $event.target.value)"
      />
    </div>
  </div>
  <div v-else>No Target</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Editor } from '@tiptap/vue-2'
import { Node as PMNode } from 'prosemirror-model'
import VirtualBook from '@/classes/VirtualBook'
import IdField from '@/components/IdField.vue'

@Component ({
  components: {
    IdField,
  }
})
export default class NamedBlockEditor extends Vue {
  @Prop() context?: VirtualBook;
  @Prop() editor?: Editor;
  @Prop() position?: number;

  get target(): PMNode | null {
    if(this.editor && this.position !== undefined) {
      return this.editor.state.doc.nodeAt(this.position);
    }
    return null;
  }

  setAttribute(key: string, value: string): void {
    if(this.editor && this.position !== undefined) {
      this.editor
        .chain()
        .setNodeAttribute(this.position, key, value)
        .run();
    }
  }
}
</script>
