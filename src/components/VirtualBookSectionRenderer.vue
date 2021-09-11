<template>
  <div v-if="targetSection">
    <TextRenderer
      tag="h1"
      :value="targetSection.title"
      :editable="editable"
      placeholder="Section Title"
      @change="onTitleChange($event)"
    />
    <VirtualBookContentRenderer
      tag="div"
      :value="targetSection.contents"
      :editable="editable"
      placeholder="Section Contents"
      @change="onContentChange($event)"
    />
  </div>
  <div v-else>Section Not Found</div>
</template>

<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { get } from 'lodash'
import VirtualBook, { VirtualBookSection } from '@/classes/VirtualBook'
import { SetValueRequest } from '@/classes/ObjectEditorEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import TextRenderer from '@/components/TextRenderer.vue'
import VirtualBookContentRenderer from '@/components/VirtualBookContentRenderer.vue'

@Component ({
  components: {
    TextRenderer,
    VirtualBookContentRenderer
  }
})
export default class VirtualBookSectionRenderer extends Vue {
  @Prop() source?: VirtualBook;
  @Prop() sectionPath?: number[];
  @Prop() editable?: boolean;

  get fullPath(): (string|number)[] {
    const path = [];
    if(this.sectionPath) {
      for(const step of this.sectionPath) {
        path.push('sections', step);
      }
    }
    return path;
  }

  get targetSection(): VirtualBookSection | null {
    return get(this.source, this.fullPath);
  }

  onTitleChange(change: ValueChangeDescription<string>): void {
    const request = new SetValueRequest(change);
    request.path = this.fullPath.concat('title');
    this.$emit('change', request);
  }

  onContentChange(change: ValueChangeDescription<VNode[]>): void {
    const request = new SetValueRequest(change);
    request.path = this.fullPath.concat('contents');
    this.$emit('change', request);
  }
}
</script>
