<template>
  <div>
    <input
      type="text"
      placeholder="property"
      :value="name"
      @change="onChangeName($event.target)"
    />:&nbsp;
    <input
      type="text"
      placeholder="value"
      :value="value"
      @change="onChangeValue($event.target)"
    />
    <button @click="onRemoveDeclaration()">
      <MinusIcon size="1x"/>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MinusIcon } from 'vue-feather-icons'
import { StringMap } from '@/ts/data/VirtualBook'

@Component ({
  components: {
    MinusIcon,
  },
})
export default class StyleRuleDeclarationEditor extends Vue {
  @Prop() name?: string;
  @Prop() value?: string;
  @Prop() context?: StringMap;

  onChangeName(input: HTMLInputElement): void {
    const targetValue = input.value;
    if(targetValue !== this.name) {
      if(this.context && targetValue && !this.context[targetValue]) {
        this.$emit('change', {
          value: this.value,
          path: [targetValue],
        });
        this.onRemoveDeclaration();
      } else {
        input.value = this.name ? this.name : '';
      }
    }
  }

  onChangeValue(input: HTMLInputElement): void {
    const targetValue = input.value;
    if(targetValue !== this.value) {
      if(this.context && this.name) {
        this.$emit('change', {
          value: targetValue,
          path: [this.name],
        });
      } else {
        input.value = this.value ? this.value : '';
      }
    }
  }

  onRemoveDeclaration(): void {
    this.$emit('change', {
      previousValue: this.value,
      path: this.name ? [this.name] : [''],
    });
  }
}
</script>
