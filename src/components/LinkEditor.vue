<template>
  <div>
    <LinkIcon size="1x"/>
    <input
      :value="linkURL"
      @change="setURL($event.target.value)"
      placeholder="Link URL"
    />
    <select
      :value="linkTarget"
      @change="setTarget($event.target.value)"
    >
      <option>(Open Link In..)</option>
      <option value="_blank">New Tab</option>
      <option value="_self">This Tab</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Editor } from '@tiptap/vue-2'
import { LinkIcon } from 'vue-feather-icons'

@Component ({
  components: {
    LinkIcon,
  }
})
export default class LinkEditor extends Vue {
  @Prop() editor?: Editor;

  get linkURL(): string {
    if(this.editor) {
      return this.editor.getAttributes('link').href;
    }
    return '';
  }

  setURL(value: string): void {
    if(this.editor) {
      this.editor
        .chain()
        .focus()
        .setLink({ href: value })
        .run();
    }
  }

  get linkTarget(): string {
    if(this.editor) {
      return this.editor.getAttributes('link').target;
    }
    return '';
  }

  setTarget(value: string): void {
    if(this.editor) {
      this.editor
        .chain()
        .focus()
        .setLink({ target: value })
        .run();
    }
  }
}
</script>
<style lang="stylus" scoped>
.feather-link
  margin-left 4px
  margin-right 4px
</style>
