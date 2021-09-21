<template>
  <HypertextEditor
    v-if="editable"
    tag="div"
    :contents="value"
    :placeholder="placeholder"
    @change="$emit('change',$event)"
  />
  <HypertextSegment
    v-else
    tag="div"
    :contents="value"
    editable="false"
  />
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import HypertextEditor from '@/components/HypertextEditor.vue'
import HypertextSegment from '@/components/HypertextSegment.vue'
import { NodeDescriptionChild } from '@/classes/NodeDescription'

@Component ({
  components: {
    HypertextEditor,
    HypertextSegment,
  }
})
export default class VirtualBookContentRenderer extends Vue {
  @Prop() value?: NodeDescriptionChild[];
  @Prop() placeholder?: string;
  @Prop() editable?: boolean;
}
</script>
<style lang="stylus" scoped>
[data-placeholder-text]:empty::after
  content attr(data-placeholder-text)
  color lightgray
  font-style italic
</style>
