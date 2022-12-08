<template>
  <div>
    <div v-if="target">
      <span>
        <label class="row-label">width</label>
        <input
          type="string"
          :value="target.attrs.width"
          @change="onChangeSize('width', $event.target.value)"
        >
      </span>
      <span>
        <label class="row-label">height</label>
        <input
          type="string"
          :value="target.attrs.height"
          @change="onChangeSize('height', $event.target.value)"
        >
      </span>
    </div>
    <div v-if="viewBoxValues">
      <label>View Box</label>
      <div class="view-box-pane">
        <div>
          <span>
            <label class="row-label">x</label>
            <input
              type="string"
              :value="viewBoxValues[0]"
              @change="onChangeViewBox('x', $event.target.value)"
            >
          </span>
          <span>
            <label class="row-label">y</label>
            <input
              type="string"
              :value="viewBoxValues[1]"
              @change="onChangeViewBox('y', $event.target.value)"
            >
          </span>
        </div>
        <div>
          <span>
            <label class="row-label">width</label>
            <input
              type="string"
              :value="viewBoxValues[2]"
              @change="onChangeViewBox('width', $event.target.value)"
            >
          </span>
          <span>
            <label class="row-label">height</label>
            <input
              type="string"
              :value="viewBoxValues[3]"
              @change="onChangeViewBox('height', $event.target.value)"
            >
          </span>
        </div>
      </div>
    </div>
    <button v-if="clipboard" @click="importHTML()">
      <ClipboardIcon size="1x"/>
      <ArrowRightIcon size="1x"/>
      <PenToolIcon size="1x"/>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Editor } from '@tiptap/vue-2'
import { Node as PMNode } from 'prosemirror-model'
import {
  ArrowRightIcon,
  PenToolIcon,
  ClipboardIcon,
} from 'vue-feather-icons'

@Component ({
  components: {
    ArrowRightIcon,
    PenToolIcon,
    ClipboardIcon,
  }
})
export default class SVGEditor extends Vue {
  @Prop() editor?: Editor;
  @Prop() position?: number;
  @Prop() target?: PMNode;

  get clipboard(): unknown {
    return navigator.clipboard;
  }

  get viewBoxValues(): string[] | undefined {
    if(this.target) {
      const viewBoxText = this.target.attrs?.viewBox;
      if(viewBoxText) {
        return viewBoxText.split(' ');
      }
    }
    return undefined;
  }

  onChangeSize(prop: string, value: string): void {
    if(this.editor) {
      const changes = {
        [prop]: value,
      };
      this.editor
        .chain()
        .focus()
        .setDimensions(changes, this.position)
        .run();
    }
  }

  onChangeViewBox(prop: string, value: string): void {
    if(this.editor) {
      const changes = {
        [prop]: value,
      };
      this.editor
        .chain()
        .focus()
        .setSVGViewBox(changes, this.position)
        .run();
    }
  }

  async importHTML(): Promise<void> {
    if(this.editor && this.position !== undefined) {
      const data = await navigator.clipboard.readText();
      this.editor
        .chain()
        .focus()
        .initSVGAt(this.position, data)
        .run();
    }
  }
}
</script>

<style lang="stylus" scoped>
.row-label
  font-weight bold
  margin-left 2px
  margin-right 2px
.row-label:after
  content ':'
.view-box-pane
  border 1px solid silver
</style>
