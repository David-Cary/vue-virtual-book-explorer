import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import BookExplorerView from '../views/BookExplorerView.vue'
import { StandardVirtualBookRoutes } from '@/ts/data/VirtualBook'
import VueRouteLinker from '@/ts/vue/VueRouteLinker'

Vue.use(VueRouter)

const linkedRoutes: Record<string, VueRouteLinker> = {
  pathToContent: new VueRouteLinker(
    {
      path: [
        'content-at',
        {
          name: 'sectionPath',
          asArray: true,
          types: 'number|string',
          path: [
            'searchOptions',
            'section',
            'path',
          ],
        },
      ],
      hash: true,
    },
    {
      name: StandardVirtualBookRoutes.FIND_CONTENT_AT,
      component: BookExplorerView,
    },
  ),
  findContentById: new VueRouteLinker(
    {
      path: [
        'content-by-id',
        {
          name: 'contentId',
          types: 'string',
          path: [
            'searchOptions',
            'id',
          ],
        },
      ],
      hash: true,
    },
    {
      name: StandardVirtualBookRoutes.FIND_CONTENT_BY_ID,
      component: BookExplorerView,
    },
  )
};

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: BookExplorerView,
    props: {
      searchOptions: {
        section: {
          path: [0]
        },
      },
    },
  },
  linkedRoutes.pathToContent.config,
  linkedRoutes.findContentById.config,
]

const router = new VueRouter({
  routes
})

export default router
