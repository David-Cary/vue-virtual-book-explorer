import Vue from 'vue'
import Vuex from 'vuex'
import { VirtualBookSection } from '@/classes/VirtualBook'
import ObjectEditorEngine from '@/classes/ObjectEditorEngine'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    book: {
      sections: [
        new VirtualBookSection()
      ]
    },
    opEngine: new ObjectEditorEngine()
  },
  mutations: {
    updateBook(state, payload) {
      state.opEngine.apply([payload], state.book);
    }
  },
  actions: {
  },
  modules: {
  }
})
