<template>
  <span>
    <span>Opens </span>
    <select
      :value="linkType"
      @change="setLinkType($event.target.value)"
    >
      <option value="">URL</option>
      <option :value="idRouteName">content by id</option>
    </select>
    <input
      v-if="!linkType"
      type="text"
      :value="linkURL"
      @change="setURL($event.target.value)"
      placeholder="Link URL"
    />
    <span v-if="linkType === idRouteName">
      <input
        type="text"
        :value="contentId"
        list="link-editor-content-ids"
        placeholder="content id"
        @change="contentId = $event.target.value"
      />
      <datalist v-if="ids" id="link-editor-content-ids">
        <option
          v-for="(id, index) in ids"
          :value="id"
          :key="index"
        />
      </datalist>
    </span>
    <span> in </span>
    <select
      :value="linkTarget"
      @change="setTarget($event.target.value)"
    >
      <option value="_blank">new tab</option>
      <option value="_self">this tab</option>
    </select>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router'
import { Editor } from '@tiptap/vue-2'
import { get } from 'lodash'
import { StandardVirtualBookRoutes } from '@/classes/VirtualBook'

@Component
export default class LinkEditor extends Vue {
  @Prop() editor?: Editor;
  @Prop() ids?: string[];
  @Prop() position?: number;

  emptyStringProxy = ' ';

  idRouteName = StandardVirtualBookRoutes.FIND_CONTENT_BY_ID;

  get linkURL(): string {
    if(this.editor) {
      return this.editor.getAttributes('link').href;
    }
    return '';
  }

  setURL(value: string): void {
    if(this.editor) {
      if(this.position === undefined) {
        this.editor
          .chain()
          .focus()
          .setLink({ href: value })
          .run();
      } else {
        this.editor
          .chain()
          .focus()
          .setMarkAttribute(this.position, 'link', 'href', value)
          .run();
      }
    }
  }

  get matchingRoute(): Route {
    let url = this.linkURL;
    if(typeof url === 'string') {
      url = url.replace('#', '');
    }
    return this.$router.match(url);
  }

  get routeProps(): Record<string, unknown> {
    if(this.matchingRoute.meta?.getPropsFor) {
      return this.matchingRoute.meta.getPropsFor(this.matchingRoute);
    }
    return {};
  }

  get contentId(): string {
    return get(this.routeProps, ['searchOptions', 'id'], '');
  }

  set contentId(value: string) {
    if(this.matchingRoute.meta?.createHRef) {
      const url = this.matchingRoute.meta.createHRef({
        searchOptions: {
          id: value,
        },
      });
      this.setURL(url);
    }
  }

  get linkType(): string {
    return (this.matchingRoute.name && this.matchingRoute.path !== '/')
      ? this.matchingRoute.name
      : '';
  }

  getRouteParamTerms(path: string): string[] {
    if(path) {
      const paramExp = /:[^/]+/g;
      const matches = path.match(paramExp);
      if(matches) {
        return matches;
      }
    }
    return [];
  }

  setLinkType(value: string): void {
    const routes = this.$router.getRoutes();
    const route = routes.find(route => route.name === value);
    if(route) {
      let url = `#${route.path}`;
      const paramTerms = this.getRouteParamTerms(route.path);
      for(const term of paramTerms) {
        url = url.replace(term, this.emptyStringProxy);
      }
      this.setURL(url);
    } else {
      this.setURL('');
    }
  }

  get linkTarget(): string {
    if(this.editor) {
      return this.editor.getAttributes('link').target;
    }
    return '';
  }

  setTarget(value: string): void {
    if(this.editor) {
      if(this.position === undefined) {
        const previousUrl = this.editor.getAttributes('link').href;
        this.editor
          .chain()
          .focus()
          .setLink({ href: previousUrl, target: value })
          .run();
      } else {
        this.editor
          .chain()
          .focus()
          .setMarkAttribute(this.position, 'link', 'target', value)
          .run();
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.feather-link
  margin-left 4px
  margin-right 4px
</style>
