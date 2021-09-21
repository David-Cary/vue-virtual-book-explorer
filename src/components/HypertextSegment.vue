<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { isEqual } from 'lodash'
import NodeDescription, { NodeDescriptionChild } from '@/classes/NodeDescription'

@Component
export default class HypertextSegment extends Vue {
  @Prop() tag?: string;
  @Prop() contents?: NodeDescriptionChild[];
  @Prop() placeholder?: string;
  @Prop() editable?: boolean;

  contentsOnFocus: NodeDescriptionChild[] = [];

  onTextFocus(): void {
    this.contentsOnFocus = NodeDescription.describeNodeChildren(this.$el);
  }

  onTextBlur(): void {
    const currentContents = NodeDescription.describeNodeChildren(this.$el);
    if(!isEqual(currentContents, this.contentsOnFocus)) {
      this.$emit('change', {
        value: currentContents,
        previousValue: this.contentsOnFocus.slice(),
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
        innerHTML: this.contents ? NodeDescription.toHTML(this.contents) : ''
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
