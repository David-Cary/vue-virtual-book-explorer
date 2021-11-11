<template>
  <div class="modal-layer">
    <div class="modal-background"/>
    <div class="modal-pane">
      <div class="modal-header">
        <span class="modal-title-bar">
          <slot name="header"/>
        </span>
        <button @click="$emit('close')">
          <XIcon size="1x"/>
        </button>
      </div>
      <div class="modal-body">
        <slot/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { XIcon } from 'vue-feather-icons'

@Component ({
  components: {
    XIcon,
  },
})
export default class ModalLayer extends Vue {
}
</script>

<style lang="stylus" scoped>
.modal-layer
  position fixed
  top 0px
  left 0px
  right 0px
  bottom 0px
  z-index 100
.modal-background
  position relative
  height 100%
  width 100%
  background-color black
  opacity 25%
  pointer-events none
.modal-pane
  position absolute
  top 0px
  left 0px
  background-color white
  border 4px solid gray
.modal-header
  display flex
.modal-title-bar
  width -webkit-fill-available
</style>
