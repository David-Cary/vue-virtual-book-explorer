<template>
  <span>
    <button @click="onClickPreview()">
      <EyeIcon size="1x"/>
    </button>
    <button @click="onClickDownload()">
      <DownloadIcon size="1x"/>
    </button>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EyeIcon, DownloadIcon } from 'vue-feather-icons'
import FileSaver from 'file-saver'
import VirtualBook from '@/ts/data/VirtualBook'

@Component({
  components: {
    EyeIcon,
    DownloadIcon,
  },
})
export default class VirtualBookExporter extends Vue {
  @Prop() model?: VirtualBook;

  onClickPreview(): void {
    this.$emit(
      'showPreview',
      {
        value: `<pre>${JSON.stringify(this.model, null, 2)}</pre>`
      }
    );
  }

  onClickDownload(): void {
    const data = JSON.stringify(this.model);
    const blob = new Blob([data]);
    FileSaver.saveAs(blob, 'vbook.json');
  }
}
</script>
