<script lang="ts">
import { VNode } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { StyleRuleMap } from '@/classes/VirtualBook'

@Component
export default class ScopedStyleRenderer extends Vue {
  @Prop() rules?: StyleRuleMap;

  scopeAttribute = '';

  get scopedStyleText(): string {
    if(this.scopeAttribute && this.rules) {
      let text = '';
      for(const selector in this.rules) {
        const extendedSelector = `[${this.scopeAttribute}] ${selector}`;
        const declarations = this.rules[selector];
        let declarationsText = '';
        for(const property in declarations) {
          declarationsText += `${property}: ${declarations[property]}; `;
        }
        if(text) {
          text += ' ';
        }
        text += `${extendedSelector} { ${declarationsText}}`
      }
      return text;
    }
    return '';
  }

  mounted(): void {
    const scopeExp = /data-v-[\da-z]+/;
    for(let i = 0; i < this.$el.attributes.length; i++) {
      const attribute = this.$el.attributes.item(i);
      if(attribute && attribute.name.match(scopeExp)) {
        this.scopeAttribute = attribute.name;
      }
    }
  }

  render(h: typeof Vue.prototype.$createElement): VNode {
    return h(
      'style',
      this.scopedStyleText
    );
  }
}
</script>
