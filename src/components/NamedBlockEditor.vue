<template>
  <div>
    <div>
      <IdField
        :source="context"
        :placeholder="validTypeLabel + ' Id'"
        :value="blockAttributes.id"
        @change="setAttribute('id', $event.value)"
      />
    </div>
    <div>
      <input
        type="text"
        :placeholder="validTypeLabel + ' Name'"
        :value="blockAttributes.name"
        @change="setAttribute('name', $event.target.value)"
      />
    </div>
    <div>
      <input
        type="text"
        :placeholder="validTypeLabel + ' Classes'"
        :value="blockAttributes.class"
        @change="setAttribute('class', $event.target.value)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Editor } from '@tiptap/vue-2'
import VirtualBook, { StringMap } from '@/classes/VirtualBook'
import IdField from '@/components/IdField.vue'

@Component ({
  components: {
    IdField,
  }
})
export default class NamedBlockEditor extends Vue {
  @Prop() context?: VirtualBook;
  @Prop() editor?: Editor;
  @Prop() typeName?: string;
  @Prop() typeLabel?: string;

  get validTypeLabel(): string {
    return this.typeLabel ? this.typeLabel : 'Block';
  }

  get blockAttributes(): StringMap {
    if(this.editor && this.typeName) {
      return this.editor.getAttributes(this.typeName);
    }
    return {};
  }

  setAttribute(key: string, value: string): void {
    if(this.editor && this.typeName && key) {
      const update: StringMap = {};
      update[key] = value;
      this.editor
        .chain()
        .focus()
        .updateAttributes(this.typeName, update)
        .run();
    }
  }
}
</script>
