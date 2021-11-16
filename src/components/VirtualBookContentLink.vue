<template>
  <a :href="contentUrl">{{activeTitle}}</a>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RouteRecordPublic } from 'vue-router'
import { VirtualBookContent, PathStep } from '@/classes/VirtualBook'

@Component
export default class VirtualBookContentLink extends Vue {
  @Prop() target?: VirtualBookContent;
  @Prop() path?: PathStep[];

  get sectionIndices(): number[] {
    const indices = [];
    if(this.path) {
      for(let i = 0; i < this.path.length; i++) {
        if(this.path[i] === 'sections') {
          i++;
          if(typeof this.path[i] === 'number') {
            indices.push(Number(this.path[i]));
            continue;
          }
        }
        return [];
      }
    }
    return indices;
  }

  get activeTitle(): string {
    if(this.target?.title) {
      return this.target.title;
    }
    if(this.path?.length) {
      const index = this.path[this.path.length - 1];
      if(typeof index === 'number') {
        return `Section ${index + 1}`;
      }
    }
    return 'Unknown Section';
  }

  get routes(): RouteRecordPublic[] {
    return this.$router.getRoutes();
  }

  get routeUrlMap(): {[k: string]: string} {
    const urls: {[k: string]: string} = {};
    for(const route of this.routes) {
      if(route.name) {
        urls[route.name] = `#${route.path}`;
      }
    }
    return urls;
  }

  get showByIdUrl(): string | undefined {
    return this.routeUrlMap['Show Content By Id'];
  }

  get sectionPathUrl(): string | undefined {
    return this.routeUrlMap['Show Section By Indices'];
  }

  get contentUrl(): string {
    // Check for content id.
    if(this.target?.id && this.showByIdUrl) {
     return this.showByIdUrl.replace(':content_id', this.target.id);
    }
    // Check for section path.
    if(this.sectionIndices.length && this.sectionPathUrl) {
      const indexPath = this.sectionIndices.join('/');
      return this.sectionPathUrl.replace('*', indexPath);
    }
    return '';
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
