<template>
  <span>
    <span
      v-for="(step, index) of path"
      :key="index"
    >
      <input
        type="text"
        class="source-path-step"
        :list="'source-path-step-' + index + '-options'"
        :value="step"
        @change="onStepChange(index, $event.target.value)"
      />
      <datalist
        v-if="stepOptions[index]"
        :id="'source-path-step-' + index + '-options'"
      >
        <option
          v-for="(option, optionIndex) in stepOptions[index]"
          :value="option"
          :key="optionIndex"
        />
      </datalist>
    </span>
    <input
      type="text"
      class="source-path-step"
      list="source-path-step-final-options"
      v-model="nextStep"
      @change="appendStep()"
    />
    <datalist
      v-if="stepOptions[path.length]"
      id="source-path-step-final-options"
    >
      <option
        v-for="(option, optionIndex) in stepOptions[path.length]"
        :value="option"
        :key="optionIndex"
      />
    </datalist>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VirtualBookDataCache } from '@/classes/VirtualBook'

@Component
export default class SourcePathField extends Vue {
  @Prop() value?: string[];
  @Prop() sourceData?: VirtualBookDataCache;

  nextStep = '';

  get path(): string[] {
    return this.value || [];
  }

  get stepOptions(): string[][] {
    const results: string[][] = [];
    if(this.sourceData) {
      results.push(this.sourceData.contentIds);
      if(this.path.length) {
        const firstKey = this.path[0];
        let target = this.sourceData.contentByUniqueId[firstKey];
        if(target) {
          results.push(target.localValueKeys);
          for(let i = 1; i < this.path.length; i++) {
            const step = this.path[i];
            target = target.localValues[step];
            if(target) {
              results.push(target.localValueKeys);
            } else {
              break;
            }
          }
        }
      }
    }
    return results;
  }

  onStepChange(index: number, value: string): void {
    const result = this.path.slice();
    if(value) {
      result[index] = value;
    } else {
      result.splice(index, 1);
    }
    this.$emit('change', {
      value: result,
      previousValue: this.value,
    });
  }

  appendStep(): void {
    if(this.nextStep) {
      const result = this.path.slice();
      result.push(this.nextStep);
      this.$emit('change', {
        value: result,
        previousValue: this.value,
      });
      this.nextStep = '';
    }
  }
}
</script>

<style lang="stylus" scoped>
.source-path-step
  width 128px
</style>
