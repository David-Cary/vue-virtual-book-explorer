<template>
  <span class="hypertext-editor">
    <span
      v-if="menuOpen"
      class="hypertext-editor-menu"
      :style="menuPosition"
    >
      <button @click="onCloseMenu()">
        <XIcon size="1x"/>
      </button>
    </span>
    <span
      v-else-if="selectionBounds"
      :style="caretPosition"
    >
      <button
        class="hypertext-editor-position-marker"
        @click="onOpenMenu()"
      >
        <Edit2Icon size="8"/>
      </button>
    </span>
    <HypertextSegment
      ref="textfield"
      :tag="tag"
      :contents="contents"
      :placeholder="placeholder"
      editable="true"
      @change="$emit('change',$event)"
    />
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Edit2Icon, XIcon } from 'vue-feather-icons'
import HypertextSegment from '@/components/HypertextSegment.vue'
import { NodeDescriptionChild } from '@/classes/NodeDescription'

@Component ({
  components: {
    HypertextSegment,
    Edit2Icon,
    XIcon,
  }
})
export default class HypertextEditor extends Vue {
  @Prop() tag?: string;
  @Prop() contents?: NodeDescriptionChild[];
  @Prop() placeholder?: string;

  targetRange: Range | null = null;

  menuOpen = false;

  menuPosition: { [key: string]: string } = {};

  get textfield(): Vue {
    return this.$refs['textfield'] as Vue;
  }

  get selectionBounds(): DOMRect | null {
    if(this.targetRange) {
      const baseBounds = this.textfield.$el.getBoundingClientRect();
      const rects = this.targetRange.getClientRects();
      const lastRect = rects[rects.length - 1];
      if(lastRect) {
        // Convert the selection area to local coordinates.
        lastRect.x -= baseBounds.x;
        lastRect.y -= baseBounds.y;
        return lastRect;
      }
      return new DOMRect(0, 0, 0, baseBounds.height);
    }
    return null;
  }

  get caretPosition(): { [key: string]: string } {
    const position = {
      x: this.selectionBounds
        ? (this.selectionBounds.right + this.selectionBounds.left) / 2
        : 0,
      y: this.selectionBounds ? this.selectionBounds.bottom : 0,
    };
    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
    };
  }

  mounted(): void {
    document.addEventListener('selectionchange', this.onSelection);
  }

  unmounted(): void {
    document.removeEventListener('selectionchange', this.onSelection);
  }

  onSelection(): void {
    const selection = window.getSelection();
    if(selection) {
      if(this.textfield?.$el
        && this.textfield.$el.contains(selection.anchorNode)
        && this.textfield.$el.contains(selection.focusNode)
      ) {
        this.targetRange = selection.getRangeAt(0);
        this.menuOpen = false;
      } else {
        this.targetRange = null;
      }
    }
  }

  onOpenMenu(): void {
    this.menuOpen = true;
    this.menuPosition = {
      position: 'absolute',
      top: `${this.selectionBounds ? this.selectionBounds.bottom : 0}px`,
    };
  }

  onCloseMenu(): void {
    this.menuOpen = false;
  }
}
</script>
<style lang="stylus" scoped>
.hypertext-editor
  position relative
.hypertext-editor-position-marker
  height 16px
  width 16px
  border-top-left-radius 8px
  border-top-right-radius 8px
  border-bottom-left-radius 4px
  border-bottom-right-radius 4px
  position relative
  left -50%
  z-index 1
.hypertext-editor-position-marker svg
  position absolute
  top 2px
  left 2px
.hypertext-editor-menu
  background silver
</style>
