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
      sectionPath: [0],
    },
  },
  {
    path: '/view/*',
    name: 'View Content',
    component: BookExplorerView,
    props: route => {
      const startText = '/view/';
      const trailingText = route.path.substr(startText.length);
      const steps = trailingText.split('/');
        console.log({route, steps});
      return {
        sectionPath: steps,
      };
    },
  }
]

const router = new VueRouter({
  routes
})

export default router
