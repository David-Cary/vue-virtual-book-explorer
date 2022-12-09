<template>
  <a :href="href" :target="linkTarget">{{linkText}}</a>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RouteRecordPublic } from 'vue-router'
import {
  VirtualBookContentReference,
  CreateHRef,
} from '@/ts/data/VirtualBook'

@Component
export default class VirtualBookContentLink extends Vue {
  @Prop() contentRef?: VirtualBookContentReference;
  @Prop() linkByPath?: boolean;
  @Prop() text?: string;
  @Prop() target?: string;

  get routes(): RouteRecordPublic[] {
    return this.$router.getRoutes();
  }

  get routeCallbacks(): Record<string, CreateHRef> {
    const map: Record<string, CreateHRef> = {};
    for(const route of this.routes) {
      const callback = route.meta.createHRef;
      if(route.name && callback) {
        map[route.name] = callback;
      }
    }
    return map;
  }

  get href(): string {
    if(this.contentRef) {
      const propKey = 'searchOptions';
      return this.linkByPath
        ? this.contentRef.createPathHREF(this.routeCallbacks, propKey)
        : this.contentRef.createHRef(this.routeCallbacks, propKey);
    }
    return '';
  }

  get linkTarget(): string {
    return this.target || '_self';
  }

  get linkText(): string {
    if(this.text) {
      return this.text;
    }
    return this.contentRef?.getContentLabel() || '';
  }
}
</script>
<style lang="stylus" scoped>
.vbook-table-of-contents-header
  display flex
  align-items center
  width max-content
  padding-right 4px
.vbook-table-of-contents-subsections
  margin-left 8px
svg
  vertical-align bottom
</style>
