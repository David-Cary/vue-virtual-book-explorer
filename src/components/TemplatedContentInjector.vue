<template>
  <span class="templated-content-injector">
    <span>
      <button
        class="left-half-button"
        @click="onAddContent()"
      >
        <PlusIcon size="1x"/>
      </button>
      <button
        class="right-half-button"
        @click="onChangeMode()"
      >
        <span
          :is="selectedMode.icon"
          size="1x"
          :aria-label="selectedMode.label"
        />
      </button>
    </span>
    <select v-model="selectedId">
      <option
        v-for="(id, index) in idOptions"
        :key="index"
      >{{id}}</option>
    </select>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  PlusIcon,
  CopyIcon,
  CastIcon,
} from 'vue-feather-icons'
import { JSONContent } from '@tiptap/core'
import { Editor } from '@tiptap/vue-2'

@Component ({
  components: {
    PlusIcon,
    CopyIcon,
    CastIcon,
  }
})
export default class TemplatedContentInjector extends Vue {
  @Prop() editor?: Editor;
  @Prop() templates?: Record<string, JSONContent>;
  @Prop() availableIds?: string[];

  get idOptions(): string[] {
    if(this.availableIds) {
      return this.availableIds;
    }
    return this.templates ? Object.keys(this.templates) : [];
  }

  selectedId = '';

  creationModes = [
    {
      label: 'copy',
      icon: 'CopyIcon'
    },
    {
      label: 'instantiate',
      icon: 'CastIcon'
    },
  ];

  selectedMode = this.creationModes[0];

  created(): void {
    if(this.idOptions.length) {
      this.selectedId = this.idOptions[0];
    }
  }

  onAddContent(): void {
    if(this.editor && this.templates) {
      const template = this.templates[this.selectedId];
      if(template) {
        const pos = this.editor.state.selection.$from.pos;
        switch(this.selectedMode.label) {
          case 'copy':
            this.editor
              .chain()
              .focus()
              .insertFromTemplate(pos, template)
              .run();
            break;
          case 'instantiate':
            this.editor
              .chain()
              .focus()
              .insertContentAt(
                pos,
                {
                  type: 'inlineInstance',
                  attrs: {
                    instanceOf: this.selectedId
                  },
                },
              )
              .run();
            break;
        }
      }
    }
  }

  onChangeMode(): void {
    const index = this.creationModes.indexOf(this.selectedMode);
    const nextIndex = (index + 1) % this.creationModes.length;
    this.selectedMode = this.creationModes[nextIndex];
  }
}
</script>

<style lang="stylus" scoped>
.templated-content-injector
  background-color silver
  padding-top 2px
  padding-bottom 4px
  padding-right 8px
  border-radius 16px
.templated-content-injector select
  margin-left 2px
.left-half-button
  border-radius 16px 0px 0px 16px
  border-right 1px solid silver
.right-half-button
  border-radius 0px 16px 16px 0px
  border-left 1px solid silver
</style>
