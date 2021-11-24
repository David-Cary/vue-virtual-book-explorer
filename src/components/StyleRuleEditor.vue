<template>
  <div>
    <div>
      <input
        type="text"
        placeholder="selector"
        :value="selector"
        @change="onChangeSelector($event.target)"
      />
      <button @click="onRemoveRule()">
        <MinusIcon size="1x"/>
      </button>
    </div>
    <div class="style-rule-declarations">
      <StyleRuleDeclarationEditor
        v-for="(value, key) of declarations"
        :key="key"
        :name="key"
        :value="value"
        :context="declarations"
        @change="onDeclarationChange($event)"
      />
      <div v-if="selector">
        <input
          type="text"
          placeholder="property"
          v-model="pendingPropertyName"
        />
        <button
          v-if="pendingPropertyName"
          @click="onNewDeclaration()"
        >
          <PlusIcon size="1x"/>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { PlusIcon, MinusIcon } from 'vue-feather-icons'
import { StyleRuleMap, StringMap, PathStep } from '@/classes/VirtualBook'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import StyleRuleDeclarationEditor from '@/components/StyleRuleDeclarationEditor.vue'

@Component ({
  components: {
    PlusIcon,
    MinusIcon,
    StyleRuleDeclarationEditor,
  },
})
export default class StyleRuleEditor extends Vue {
  @Prop() selector?: string;
  @Prop() declarations?: StringMap;
  @Prop() context?: StyleRuleMap;

  pendingPropertyName = '';

  onChangeSelector(input: HTMLInputElement): void {
    const targetValue = input.value;
    if(targetValue !== this.selector) {
      if(this.context && targetValue && !this.context[targetValue]) {
        this.$emit('change', {
          value: this.declarations,
          path: [targetValue],
        });
        this.onRemoveRule();
      } else {
        input.value = this.selector ? this.selector : '';
      }
    }
  }

  onRemoveRule(): void {
    this.$emit('change', {
      previousValue: this.declarations,
      path: this.selector ? [this.selector] : [],
    });
  }

  onNewDeclaration(): void {
    this.$emit('change', {
      value: '',
      path: [
        this.selector,
        this.pendingPropertyName
      ],
    });
  }

  onDeclarationChange(change: ValueChangeDescription<string>): void {
    if(this.selector && change.path) {
      const basePath: PathStep[] = [this.selector];
      change.path = basePath.concat(change.path);
      this.$emit('change', change);
    }
  }
}
</script>

<style lang="stylus" scoped>
.style-rule-declarations
  margin-left 8px
</style>
