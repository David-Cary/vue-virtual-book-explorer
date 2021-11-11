import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'
import VirtualBook from '@/classes/VirtualBook'
import VueObjectEditorEngine from '@/classes/VueObjectEditorEngine'

Vue.use(Vuex)

interface InternalClipboard {
  source?: {[k: string]: unknown};
  remove?: boolean;
}

interface AppState {
  book: VirtualBook;
  clipboard: InternalClipboard;
}

const vuexSession = new VuexPersistence({
  storage: window.sessionStorage,
  reducer: (state: AppState) => ({
    book: state.book,
    clipboard: state.clipboard,
  })
});

const opEngine = new VueObjectEditorEngine();

export default new Vuex.Store({
  state: {
    book: new VirtualBook(),
    clipboard: {}
  },
  mutations: {
    updateBook(state, payload) {
      opEngine.apply([payload], state.book);
    },
    updateClipboard(state, payload) {
      state.clipboard = payload;
    }
  },
  actions: {
  },
  modules: {
  },
  plugins: [vuexSession.plugin]
})
