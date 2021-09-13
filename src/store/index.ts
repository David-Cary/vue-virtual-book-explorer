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
    opEngine: new ObjectEditorEngine(),
    clipboard: {}
  },
  mutations: {
    updateBook(state, payload) {
      state.opEngine.apply([payload], state.book);
    },
    updateClipboard(state, payload) {
      state.clipboard = payload;
    }
  },
  actions: {
  },
  modules: {
  }
})
