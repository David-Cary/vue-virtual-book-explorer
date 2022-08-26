import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import BookExplorerView from '../views/BookExplorerView.vue'
import VirtualBook, { VirtualBookContent } from '@/classes/VirtualBook'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: BookExplorerView,
    props: {
      searchOptions: {
        path: ['sections', 0],
      },
    },
  },
  {
    path: '/show-section-at/*',
    name: 'Show Section By Indices',
    component: BookExplorerView,
    props: route => {
      const startText = '/view/';
      const trailingText = route.path.substr(startText.length);
      const steps = trailingText.split('/');
      const path: (string | number)[] = [];
      for(let i = 1; i < steps.length; i++) {
        path.push('sections', steps[i]);
      }
      return {
        searchOptions: {
          path,
        },
      };
    },
  },
  {
    path: '/show-topic/:content_id',
    name: 'Show Content By Id',
    component: BookExplorerView,
    props: route => {
      return {
        searchOptions: {
          matchVia: (item: VirtualBookContent) => {
            return VirtualBook.getContentId(item) === route.params['content_id'];
          }
        }
      };
    },
  },
  {
    path: '/find',
    name: 'Find Content',
    component: BookExplorerView,
    props: route => {
      return {
        searchOptions: {
          matchVia: (item: VirtualBookContent) => {
            if(typeof route.query?.term === 'string') {
              const casedTerm = route.query.term.toLowerCase();
              if(item.title && item.title?.toLowerCase() === casedTerm) {
                return true;
              }
            }
            return false;
          }
        }
      };
    },
  },
]

const router = new VueRouter({
  routes
})

export default router
