<template>
  <input
    type="text"
    v-model="localValue"
    :placeholder="placeholder"
    :class="errorClass"
    @input="onInput($event.target)"
    @change="onInputComplete($event.target)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import VirtualBook, { VirtualBookContent } from '@/classes/VirtualBook'

@Component
export default class IdField extends Vue {
  @Prop() source?: VirtualBook;
  @Prop() value?: string;
  @Watch('value', { immediate: true })
  onValueChange(): void {
    this.localValue = this.value;
    this.errorClass = '';
  }
  @Prop() placeholder?: string;

  localValue? = '';

  errorClass = '';

  onInput(field: HTMLInputElement): void {
    this.errorClass = '';
    if(field.value) {
      if(!field.value.match(/^([a-z]|[A-Z])/)) {
        this.errorClass = 'invalid-id';
      } else if(this.source && field.value !== this.value) {
        const matches = VirtualBook.searchBookContents(
          this.source,
          {
            matchVia: (item: VirtualBookContent) => {
              return VirtualBook.getContentId(item) === field.value;
            },
          }
        );
        if(matches.length) {
          this.errorClass = 'duplicate-id';
        }
      }
    }
  }

  onInputComplete(): void {
    if(this.errorClass) {
      this.localValue = this.value;
      this.errorClass = '';
    } else {
      this.$emit('change', {
        value: this.localValue,
        previousValue: this.value,
      });
    }
  }
}
</script>

<style lang="stylus" scoped>
.duplicate-id
  background-color yellow
.invalid-id
  background-color salmon
</style>
