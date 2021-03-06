import Vue from 'vue'
import { test } from '@/test'
import VTreeview from '@/components/VTreeview/VTreeview'

const singleRootTwoChildren = [
  { id: 0, name: 'Root', children: [{ id: 1, name: 'Child' }, { id: 2, name: 'Child 2' }] }
]

const threeLevels = [
  { id: 0, name: 'Root', children: [{ id: 1, name: 'Child', children: [{ id: 2, name: 'Grandchild' }] }, { id: 3, name: 'Child' }] }
]

test('VTreeView.ts', ({ mount }) => {
  it('should render items', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: singleRootTwoChildren
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should select all descendants', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        selectable: true
      }
    })

    const fn = jest.fn()
    wrapper.vm.$on('input', fn)

    wrapper.find('.v-treeview-node__checkbox')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([0, 1, 3, 2])
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should load children when expanding', async () => {
    const loadChildren = item => {
      item.children = [{ id: 1, name: 'Child' }]
    }

    const wrapper = mount(VTreeview, {
      propsData: {
        items: [{ id: 0, name: 'Root', children: [] }],
        loadChildren
      }
    })

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.find('.v-treeview-node__toggle')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should load children when selecting, but not render', async () => {
    const loadChildren = item => {
      item.children = [{ id: 1, name: 'Child' }]
    }

    const wrapper = mount(VTreeview, {
      propsData: {
        items: [{ id: 0, name: 'Root', children: [] }],
        selectable: true,
        loadChildren
      }
    })

    const fn = jest.fn()
    wrapper.vm.$on('input', fn)

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.find('.v-treeview-node__checkbox')[0].trigger('click')
    await new Promise(resolve => setTimeout(resolve))

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([0, 1])
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should emit active node when clicking on it', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [{ id: 0, name: 'Root' }, { id: 1, name: 'Root' }],
        activatable: true
      }
    })

    const fn = jest.fn()
    wrapper.vm.$on('update:active', fn)

    wrapper.find('.v-treeview-node__root')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([0])

    wrapper.find('.v-treeview-node__root')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(fn).toHaveBeenCalledWith([])
  })

  it('should allow multiple active nodes with prop multipleActive', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [{ id: 0, name: 'Root' }, { id: 1, name: 'Root' }],
        multipleActive: true,
        activatable: true
      }
    })

    const fn = jest.fn()
    wrapper.vm.$on('update:active', fn)

    wrapper.find('.v-treeview-node__root').forEach(vm => vm.trigger('click'))
    await wrapper.vm.$nextTick()

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith([0, 1])
  })

  it('should update selection when selected prop changes', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [{ id: 0, name: 'Root', children: [{ id: 1, name: 'Child' }] }],
        value: []
      }
    })

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.find('.v-treeview-node__toggle')[0].trigger('click')
    wrapper.setProps({ value: [1] })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.v-treeview-node').length).toBe(2)
    expect(wrapper.find('.v-treeview-node--selected').length).toBe(2)
    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({ value: undefined })
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should open all children when using open-all prop', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        openAll: true
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should react to open changes', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        open: [1]
      }
    })

    const fn = jest.fn()

    wrapper.vm.$on('update:open', fn)
    wrapper.setProps({ open: [0, 1] })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({ open: [0] })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({ open: [0, 1] })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()

    expect(fn).toHaveBeenCalledWith([0, 1])

    // Should not update open values that do not exist in the tree
    wrapper.setProps({ open: [7] })

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()

    expect(fn).toHaveBeenCalledWith([])
  })

  it('should update selected and active on created', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        active: [2],
        value: [1]
      }
    })

    // TODO: I can not find away in avoriaz
    // to catch events being emitted from a
    // lifecycle hook. We should not assert
    // internal state.
    expect([...wrapper.vm.activeCache]).toEqual([2])
    expect([...wrapper.vm.selectedCache]).toEqual([1, 2])
  })

  it('should react to changes for active items', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        active: [2]
      }
    })

    const active = jest.fn()
    wrapper.vm.$on('update:active', active)

    wrapper.setProps({ active: [] })
    await wrapper.vm.$nextTick()
    expect(active).toHaveBeenCalledWith([])

    // without multiple-active, it will use last value in array
    wrapper.setProps({ active: [1, 3] })
    await wrapper.vm.$nextTick()
    expect(active).toHaveBeenCalledWith([3])

    wrapper.setProps({ multipleActive: true, active: [1, 3] })
    await wrapper.vm.$nextTick()
    expect(active).toHaveBeenCalledWith([1, 3])

    // 7 does not exist, we get nothing back
    wrapper.setProps({ active: [7] })
    await wrapper.vm.$nextTick()
    expect(active).toHaveBeenCalledWith([])

    wrapper.setProps({ active: [0], items: singleRootTwoChildren })
    await wrapper.vm.$nextTick()
    expect(active).toHaveBeenCalledWith([0])
  })

  it('should react to changes for selected items', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: threeLevels,
        value: [2]
      }
    })

    const value = jest.fn()
    wrapper.vm.$on('input', value)

    wrapper.setProps({ value: [] })
    await wrapper.vm.$nextTick()
    expect(value).toHaveBeenCalledWith([])

    wrapper.setProps({ value: [3] })
    await wrapper.vm.$nextTick()
    expect(value).toHaveBeenCalledWith([3])

    // 7 does not exist, we get nothing back
    wrapper.setProps({ value: [7] })
    await wrapper.vm.$nextTick()
    expect(value).toHaveBeenCalledWith([])

    wrapper.setProps({ value: [0], items: singleRootTwoChildren })
    await wrapper.vm.$nextTick()
    expect(value).toHaveBeenCalledWith([0, 1, 3, 2])
  })

  it('should accept string value for id', async () => {
    const wrapper = mount(VTreeview, {
      propsData: { itemKey: 'name' }
    })

    wrapper.setProps({ items: [{ name: 'Foobar' }] })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.nodes['Foobar']).toBeTruthy()

    wrapper.setProps({ value: ['Foobar'] })

    await wrapper.vm.$nextTick()
  })

  it('should warn developer when using non-scoped slots', () => {
    mount(VTreeview, {
      slots: {
        prepend: [{ render: h => h('div') }],
        append: [{ render: h => h('div') }]
      }
    })

    expect('[Vuetify] The prepend and append slots require a slot-scope attribute').toHaveBeenTipped()
  })

  it('should not show expand icon when children is empty', () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [
          {
            text: 'root',
            children: []
          }
        ]
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.find('.v-treeview-node__toggle').length).toBe(0)
  })

  it('should show expand icon when children is empty and load-children prop used', () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        loadChildren: () => {},
        items: [
          {
            text: 'root',
            children: []
          }
        ]
      }
    })

    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.find('.v-treeview-node__toggle').length).toBe(1)
  })

  it('should recalculate tree when loading async children using custom key', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [
          {
            id: 1,
            name: 'One',
            __children: []
          }
        ],
        itemChildren: '__children',
        loadChildren: item => item.__children.push({ id: 2, name: 'Two' })
      }
    })

    wrapper.find('.v-treeview-node__toggle')[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()

  })

  it('should remove old nodes', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [
          {
            id: 1,
            name: 'one'
          },
          {
            id: 2,
            name: 'two'
          }
        ]
      }
    })

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({ items: [
      {
        id: 1,
        name: 'one'
      }
    ] })

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({ items: [
      {
        id: 1,
        name: 'one'
      },
      {
        id: 3,
        name: 'three'
      }
    ] })

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()

    expect(Object.keys(wrapper.vm.nodes).length).toBe(2)
  })

  it('should handle replacing items with new array of equal length', async () => {
    const wrapper = mount(VTreeview, {
      propsData: {
        items: [
          {
            id: 1,
            name: 'one'
          },
          {
            id: 2,
            name: 'two'
          }
        ]
      }
    })

    expect(wrapper.html()).toMatchSnapshot()

    wrapper.setProps({
      items: [
        {
          id: 1,
          name: 'one'
        },
        {
          id: 3,
          name: 'three'
        }
      ]
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toMatchSnapshot()
  })
})
