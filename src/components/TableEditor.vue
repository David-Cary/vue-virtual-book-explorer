<template>
  <table>
    <tr v-if="canAddRowAbove || nodeType === 'table'">
      <td v-if="canEditColumns"></td>
      <td>
        <button
          v-if="canAddRowAbove"
          @click="addRowBefore()"
        >
          <ChevronUpIcon size="1x"/>
        </button>
      </td>
      <td v-if="canEditColumns"></td>
      <td>
        <button
          v-if="!nodeType || nodeType === 'table'"
          @click="deleteTable()"
        >
          <Trash2Icon size="1x"/>
        </button>
      </td>
    </tr>
    <tr>
      <td v-if="canEditColumns">
        <button @click="addColumnBefore()">
          <ChevronLeftIcon size="1x"/>
        </button>
      </td>
      <td>
        <PlusIcon size="1x"/>
      </td>
      <td v-if="canEditColumns">
        <button @click="addColumnAfter()">
          <ChevronRightIcon size="1x"/>
        </button>
      </td>
      <td>
        <button
          v-if="nodeType !== 'table'"
          @click="deleteRow()"
        >
          <MinusIcon size="1x"/>
        </button>
      </td>
    </tr>
    <tr>
      <td v-if="canEditColumns"></td>
      <td>
        <button @click="addRowAfter()">
          <ChevronDownIcon size="1x"/>
        </button>
      </td>
      <td v-if="canEditColumns"></td>
      <td></td>
    </tr>
    <tr v-if="canEditColumns">
      <td></td>
      <td>
        <button @click="deleteColumn()">
          <MinusIcon size="1x"/>
        </button>
      </td>
      <td></td>
      <td></td>
    </tr>
  </table>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Editor } from '@tiptap/vue-2'
import {
  PlusIcon,
  MinusIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'vue-feather-icons'

@Component ({
  components: {
    PlusIcon,
    MinusIcon,
    Trash2Icon,
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
  }
})
export default class TableEditor extends Vue {
  @Prop() editor?: Editor;
  @Prop() nodeType?: string;

  get canAddRowAbove(): boolean {
    return !this.nodeType
      || this.nodeType === 'tableRow'
      || this.nodeType === 'tableCell';
  }

  get canEditColumns(): boolean {
    return !this.nodeType
      || this.nodeType === 'tableCell'
      || this.nodeType === 'tableHeader';
  }

  addColumnAfter(): void {
    if(this.editor) {
      this.editor.chain().focus().addColumnAfter().run();
    }
  }

  addColumnBefore(): void {
    if(this.editor) {
      this.editor.chain().focus().addColumnBefore().run();
    }
  }

  addRowAfter(): void {
    if(this.editor) {
      this.editor.chain().focus().addRowAfter().run();
    }
  }

  addRowBefore(): void {
    if(this.editor) {
      this.editor.chain().focus().addRowBefore().run();
    }
  }

  deleteColumn(): void {
    if(this.editor) {
      const confirmed = window.confirm("Are you sure you want to remove this column?");
      if(confirmed) {
        this.editor.chain().focus().deleteColumn().run();
      }
    }
  }

  deleteRow(): void {
    if(this.editor) {
      const confirmed = window.confirm("Are you sure you want to remove this row?");
      if(confirmed) {
        this.editor.chain().focus().deleteRow().run();
      }
    }
  }

  deleteTable(): void {
    if(this.editor) {
      const confirmed = window.confirm("Are you sure you want to remove this table?");
      if(confirmed) {
        this.editor.chain().focus().deleteTable().run();
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
table
  text-align center
</style>
