import Vue from 'vue'
import Vuex from 'vuex'
import VirtualBook from '@/classes/VirtualBook'
import ObjectEditorEngine from '@/classes/ObjectEditorEngine'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    book: new VirtualBook(),
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
