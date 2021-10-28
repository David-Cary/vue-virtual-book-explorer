import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import BookExplorerView from '../views/BookExplorerView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: BookExplorerView,
    props: {
      contentCriteria: {
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
        contentCriteria: {
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
        contentCriteria: {
          id: route.params['content_id'],
        },
      };
    },
  },
]

const router = new VueRouter({
  routes
})

export default router
