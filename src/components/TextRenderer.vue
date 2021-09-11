<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TextRenderer extends Vue {
  @Prop() tag?: string;
  @Prop() value?: string;
  @Prop() placeholder?: string;
  @Prop() editable?: boolean;

  focusValue = '';

  onTextFocus(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    this.focusValue = element.innerText;
  }

  onTextBlur(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    const value = element.innerText;
    if(value !== this.focusValue) {
      this.$emit('change', {
        value,
        previousValue: this.focusValue,
      });
    }
  }

  render(h: typeof Vue.prototype.$createElement): VNode {
    const tag = this.tag ? this.tag : 'span';
    const data = {
      attrs: {
        contenteditable: this.editable ? 'true' : undefined,
        'data-placeholder-text': this.placeholder,
      },
      domProps: {
        innerText: this.value,
      },
      on: {
        focus: this.onTextFocus,
        blur: this.onTextBlur,
      },
    };
    return h(tag, data);
  }
}
</script>
<style lang="stylus" scoped>
[data-placeholder-text]:empty::after
  content attr(data-placeholder-text)
  color lightgray
  font-style italic
</style>
