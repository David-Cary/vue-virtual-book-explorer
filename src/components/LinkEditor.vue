<template>
  <span>
    <span>Opens </span>
    <select
      :value="linkType"
      @change="setLinkType($event.target.value)"
    >
      <option value="">URL</option>
      <option value="Show Content By Id">content by id</option>
    </select>
    <input
      v-if="!linkType"
      :value="linkURL"
      @change="setURL($event.target.value)"
      placeholder="Link URL"
    />
    <span v-if="matchingRoute.params['content_id']">
      <input
        :value="validatedParams['content_id']"
        list="link-editor-content-ids"
        placeholder="content id"
        @change="setLinkParam('content_id', $event.target.value)"
      />
      <datalist id="link-editor-content-ids">
        <option
          v-for="(id, index) in knownIds"
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
import { Route } from 'vue-router';
import { Editor } from '@tiptap/vue-2'
import VirtualBook from '@/classes/VirtualBook'

@Component
export default class LinkEditor extends Vue {
  @Prop() editor?: Editor;
  @Prop() context?: VirtualBook;
  @Prop() position?: number;

  emptyStringProxy = ' ';

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
          .setNodeAttribute(this.position, 'url', value)
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

  get validatedParams(): {[k: string]: unknown} {
    const params: {[k: string]: unknown} = {};
    for(const key in this.matchingRoute.params) {
      const rawValue = this.matchingRoute.params[key];
      params[key] = rawValue !== this.emptyStringProxy ? rawValue : '';
    }
    return params;
  }

  get knownIds(): string[] {
    if(this.context) {
      return VirtualBook.getIdsIn(this.context);
    }
    return [];
  }

  setLinkParam(key: string, value: string): void {
    if(this.matchingRoute.matched.length) {
      let url = `#${this.matchingRoute.matched[0].path}`;
      for(const paramKey in this.matchingRoute.params) {
        const targetValue = paramKey === key
          ? (value ? value : this.emptyStringProxy)
          : this.matchingRoute.params[paramKey];
        url = url.replace(`:${paramKey}`, targetValue);
      }
      this.setURL(url);
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
          .setNodeAttribute(this.position, 'target', value)
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
