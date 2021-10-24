<template>
  <span>
    <button @click="showPreview()">
      <EyeIcon size="1x"/>
    </button>
    <button @click="onClickDownload()">
      <DownloadIcon size="1x"/>
    </button>
    <div
      v-if="previewContent"
      class="preview-pane"
    >
      <div>
        <button
          class="close-button"
          @click="closePreview()"
        >
          <XIcon size="1x"/>
        </button>
      </div>
      <div v-html="previewContent"/>
    </div>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EyeIcon, XIcon, DownloadIcon } from 'vue-feather-icons'
import FileSaver from 'file-saver'
import VirtualBook from '@/classes/VirtualBook'

@Component({
  components: {
    EyeIcon,
    XIcon,
    DownloadIcon,
  },
})
export default class VirtualBookExporter extends Vue {
  @Prop() model?: VirtualBook;

  previewContent = '';

  showPreview(): void {
    this.previewContent = `<pre>${JSON.stringify(this.model, null, 2)}</pre>`;
  }

  closePreview(): void {
    this.previewContent = '';
  }

  onClickDownload(): void {
    const data = JSON.stringify(this.model);
    const blob = new Blob([data]);
    FileSaver.saveAs(blob, 'vbook.json');
  }
}
</script>

<style lang="stylus" scoped>
.preview-pane
  position fixed
  top 0px
  left 0px
  right 0px
  bottom 0px
  z-index 10
  background-color white
  border 4px solid gray
.close-button
  float right
</style>
