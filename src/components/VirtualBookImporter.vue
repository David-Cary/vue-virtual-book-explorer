<template>
  <span class="vbook-exporter">
    <button @click="onClickImport()">
      <UploadIcon size="1x"/>
    </button>
    <input
      type="file"
      ref="hiddenInput"
      class="hidden"
      @change="onFileSelected()"
    />
  </span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { UploadIcon } from 'vue-feather-icons'

@Component({
  components: {
    UploadIcon
  },
})
export default class VirtualBookImporter extends Vue {

  onClickImport(): void {
    const hiddenInput = this.$refs.hiddenInput as HTMLInputElement;
    hiddenInput.click();
  }

  onFileSelected():void {
    const hiddenInput = this.$refs.hiddenInput as HTMLInputElement;
    if(hiddenInput.files && hiddenInput.files.length) {
      const reader = new FileReader();
      reader.onload = () => {
        if(typeof reader.result === 'string') {
          const parsedData = JSON.parse(reader.result);
          this.$emit('complete', parsedData);
        }
        hiddenInput.value = '';
      }
      reader.readAsText(hiddenInput.files[0]);
    }
  }
}
</script>

<style lang="stylus" scoped>
.hidden
  display none
</style>
