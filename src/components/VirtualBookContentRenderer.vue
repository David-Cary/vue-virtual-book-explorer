<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { isEqual } from 'lodash'
import NodeDescription, { NodeDescriptionChild } from '@/classes/NodeDescription'

@Component
export default class VirtualBookContentRenderer extends Vue {
  @Prop() tag?: string;
  @Prop() value?: NodeDescriptionChild[];
  @Prop() placeholder?: string;
  @Prop() editable?: boolean;

  focusValue: NodeDescriptionChild[] = [];

  onTextFocus(): void {
    this.focusValue = NodeDescription.describeNodeChildren(this.$el);
  }

  onTextBlur(): void {
    const value = NodeDescription.describeNodeChildren(this.$el);
    if(!isEqual(value, this.focusValue)) {
      this.$emit('change', {
        value,
        previousValue: this.focusValue.slice(),
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
      on: {
        focus: this.onTextFocus,
        blur: this.onTextBlur,
      },
      domProps: {
        innerHTML: this.value ? NodeDescription.toHTML(this.value) : ''
      }
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
