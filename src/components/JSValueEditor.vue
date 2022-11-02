<template>
  <div>
    <select
      :value = "valueType"
      @change="onTypeChange($event.target.value)"
    >
      <option
        v-for="(type, name) in dataTypes"
        :key="name"
      >{{name}}</option>
    </select>
    <input
      v-if="valueType === 'string'"
      type="text"
      :value="value"
      @change="onValueChange($event.target.value)"
    >
    <input
      v-else-if="valueType === 'number'"
      type="number"
      :value="value"
      @change="onValueChange($event.target.value)"
    >
    <select
      v-else-if="valueType === 'boolean'"
      :value="value"
      @change="onValueChange($event.target.value)"
    >
      <option :value="true">true</option>
      <option :value="false">false</option>
    </select>
    <div v-else-if="valueType === 'object' || valueType === 'array'">
      <div
        v-for="(item, key) in value"
        :key="key"
        class="flex-row"
      >
        <input
          :type="valueType === 'object' ? 'text' : 'number'"
          class="collection-key-input"
          :value="key"
          @change="onItemKeyChange(key, $event.target.value)"
        >:
        <JSValueEditor
          :value="item"
          @change="onItemChange($event, key)"
        />
        <MinusSquareIcon size="1x" @click="onRemoveItemAt(key)"/>
      </div>
      <div class="pending-property flex-row">
        <input
          :type="valueType === 'object' ? 'text' : 'number'"
          class="collection-key-input"
          v-model="pendingKey"
        >:
        <JSValueEditor
          :value="pendingValue"
          @change="pendingValue = $event.value"
        />
        <PlusSquareIcon size="1x" @click="onAddItem()"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  PlusSquareIcon,
  MinusSquareIcon,
} from 'vue-feather-icons'
import { clone, cloneDeep } from 'lodash'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'

interface DataType {
  defaultValue?: unknown;
}

@Component ({
  components: {
    PlusSquareIcon,
    MinusSquareIcon,
  },
})
export default class JSValueEditor extends Vue {
  @Prop() value: unknown;

  dataTypes: Record<string, DataType> = {
    array: {
      defaultValue: [],
    },
    boolean: {
      defaultValue: false,
    },
    null: {
      defaultValue: null,
    },
    number: {
      defaultValue: 0,
    },
    object: {
      defaultValue: {},
    },
    string: {
      defaultValue: '',
    },
    undefined: {},
  };

  pendingKey = '';
  pendingValue = '';

  get valueType(): string {
    if(Array.isArray(this.value)) {
      return 'array';
    }
    if(this.value === null) {
      return 'null';
    }
    return typeof this.value;
  }

  get valueString(): string {
    return String(this.value);
  }

  onTypeChange(typeName: string): void {
    const dataType = this.dataTypes[typeName];
    if(dataType) {
      const value = cloneDeep(dataType.defaultValue);
      this.emitChange(value);
    }
  }

  emitChange(value: unknown, path?: (string | number)[]): void {
    this.$emit('change', {
      value,
      previousValue: this.value,
      path,
    });
  }

  onValueChange(value: string): void {
    let typedValue = this.destringify(value, this.valueType);
    this.emitChange(typedValue);
  }

  destringify(value: string, type: string): unknown {
    switch(type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
    }
    return value;
  }

  onAddItem(): void {
    const item = cloneDeep(this.pendingValue);
    if(this.valueType === 'array') {
      const index = Number(this.pendingKey);
      this.emitChange(item, [index]);
    } else {
      this.emitChange(item, [this.pendingKey]);
    }
  }

  onRemoveItemAt(key: (string | number)): void {
    let modified = clone(this.value);
    if(Array.isArray(modified)) {
      modified.splice(Number(key), 1);
    } else {
      delete (modified as Record<string, unknown>)[key];
    }
    this.emitChange(modified);
  }

  onItemChange(
    change: ValueChangeDescription<unknown>,
    key: (string | number),
  ): void {
    if(change.path) {
      change.path.unshift(key);
    } else {
      change.path = [key];
    }
    this.$emit('change', change);
  }

  onItemKeyChange(
    previousKey: (string | number),
    newKey: (string | number)
  ): void {
    let modified = clone(this.value);
    if(Array.isArray(modified)) {
      const previousIndex = Number(previousKey);
      const item = modified[previousIndex];
      modified.splice(previousIndex, 1);
      modified.splice(Number(newKey), 0, item)
    } else {
      const collection = modified as Record<string, unknown>;
      const item = collection[previousKey];
      delete collection[previousKey];
      collection[newKey] = item;
    }
    this.emitChange(modified);
  }
}
</script>

<style lang="stylus" scoped>
.collection-key-input
  width 64px
.pending-property
  opacity 60%
.flex-row
  display flex
svg.feather-plus-square
  cursor pointer
svg.feather-minus-square
  cursor pointer
</style>
