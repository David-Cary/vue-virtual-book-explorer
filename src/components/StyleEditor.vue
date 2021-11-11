<template>
  <div v-if="value">
    <StyleRuleEditor
      v-for="(declarations, selector) of value"
      :key="selector"
      :selector="selector"
      :declarations="declarations"
      :context="value"
      @change="$emit('change', $event)"
    />
    <div>
      <input
        type="text"
        v-model="pendingSelector"
        list="style-editor-unused-selectors"
        placeholder="selector"
      />
      <datalist id="style-editor-unused-selectors">
        <option
          v-for="(id, index) in unusedSelectors"
          :value="id"
          :key="index"
        />
      </datalist>
      <button
        :disabled='!pendingSelector'
        @click="onNewRule()"
      >
        <PlusIcon size="1x"/>
      </button>
    </div>
  </div>
  <div v-else>No style provided.</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { PlusIcon } from 'vue-feather-icons'
import { StyleRuleMap } from '@/classes/VirtualBook'
import StyleRuleEditor from '@/components/StyleRuleEditor.vue'

@Component ({
  components: {
    PlusIcon,
    StyleRuleEditor,
  },
})
export default class StyleEditor extends Vue {
  @Prop() value?: StyleRuleMap;
  @Prop() suggestedSelectors?: string[];

  pendingSelector = '';

  get unusedSelectors(): string[] {
    const selectors = [];
    if(this.suggestedSelectors) {
      for(const selector of this.suggestedSelectors) {
        if(this.value && this.value[selector]){
          continue;
        }
        selectors.push(selector);
      }
    }
    return selectors;
  }

  onNewRule(): void {
    this.$emit('change', {
      value: {},
      path: [this.pendingSelector],
    });
  }
}
</script>
