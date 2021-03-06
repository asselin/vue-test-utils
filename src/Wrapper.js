// @flow

import { matchesSelector } from 'sizzle'
import { isValidSelector } from './lib/validators'
import findVueComponents from './lib/findVueComponents'
import findMatchingVNodes from './lib/findMatchingVNodes'
import VueWrapper from './VueWrapper'
import WrapperArray from './WrapperArray'
import ErrorWrapper from './ErrorWrapper'

export default class Wrapper implements BaseWrapper {
  vnode: VNode;
  vm: Component | null;
  isVueComponent: boolean;
  element: HTMLElement;
  update: Function;
  options: WrapperOptions;

  constructor (vnode: VNode, update: Function, options: WrapperOptions) {
    this.vnode = vnode
    this.element = vnode.elm
    this.update = update
    this.options = options
  }

  at () {
    throw new Error('at() must be called on a WrapperArray')
  }

  /**
   * Checks if wrapper contains provided selector.
   */
  contains (selector: string | Component) {
    if (!isValidSelector(selector)) {
      throw new Error('wrapper.contains() must be passed a valid CSS selector or a Vue constructor')
    }

    if (typeof selector === 'object') {
      const vm = this.vm || this.vnode.context.$root
      return findVueComponents(vm, selector.name).length > 0
    }

    if (typeof selector === 'string' && this.element instanceof HTMLElement) {
      return this.element.querySelectorAll(selector).length > 0
    }

    return false
  }

  /**
   * Checks if wrapper has an attribute with matching value
   */
  hasAttribute (attribute: string, value: string) {
    if (typeof attribute !== 'string') {
      throw new Error('wrapper.hasAttribute() must be passed attribute as a string')
    }

    if (typeof value !== 'string') {
      throw new Error('wrapper.hasAttribute() must be passed value as a string')
    }

    return this.element && this.element.getAttribute(attribute) === value
  }

  /**
   * Asserts wrapper has a class name
   */
  hasClass (className: string) {
    if (typeof className !== 'string') {
      throw new Error('wrapper.hasClass() must be passed a string')
    }

    return this.element.className.split(' ').indexOf(className) !== -1
  }

  /**
   * Asserts wrapper has a prop name
   */
  hasProp (prop: string, value: string) {
    if (!this.isVueComponent) {
      throw new Error('wrapper.hasProp() must be called on a Vue instance')
    }
    if (typeof prop !== 'string') {
      throw new Error('wrapper.hasProp() must be passed prop as a string')
    }

    return !!this.vm && !!this.vm.$props && this.vm.$props[prop] === value
  }

  /**
   * Checks if wrapper has a style with value
   */
  hasStyle (style: string, value: string) {
    if (typeof style !== 'string') {
      throw new Error('wrapper.hasStyle() must be passed style as a string')
    }

    if (typeof value !== 'string') {
      throw new Error('wrapper.hasClass() must be passed value as string')
    }

      /* istanbul ignore next */
    if (navigator.userAgent.includes && (navigator.userAgent.includes('node.js') || navigator.userAgent.includes('jsdom'))) {
      console.warn('wrapper.hasStyle is not fully supported when running jsdom - only inline styles are supported') // eslint-disable-line no-console
    }
    const body = document.querySelector('body')
    const mockElement = document.createElement('div')

    if (!(body instanceof HTMLElement)) {
      return false
    }
    const mockNode = body.insertBefore(mockElement, null)
    // $FlowIgnore : Flow thinks style[style] returns a number
    mockElement.style[style] = value

    if (!this.options.attachedToDocument) {
      const vm = this.vm || this.vnode.context.$root
      body.insertBefore(vm.$root._vnode.elm, null)
    }

    const elStyle = window.getComputedStyle(this.element)[style]
    const mockNodeStyle = window.getComputedStyle(mockNode)[style]
    return elStyle === mockNodeStyle
  }

  /**
   * Finds first node in tree of the current wrapper that matches the provided selector.
   */
  find (selector: string) {
    if (!isValidSelector(selector)) {
      throw new Error('wrapper.find() must be passed a valid CSS selector or a Vue constructor')
    }

    if (typeof selector === 'object') {
      if (!selector.name) {
        throw new Error('.find() requires component to have a name property')
      }
      const vm = this.vm || this.vnode.context.$root
      const components = findVueComponents(vm, selector.name)
      if (components.length === 0) {
        return new ErrorWrapper('Component')
      }
      return new VueWrapper(components[0], this.options)
    }

    const nodes = findMatchingVNodes(this.vnode, selector)

    if (nodes.length === 0) {
      return new ErrorWrapper(selector)
    }
    return new Wrapper(nodes[0], this.update, this.options)
  }

  /**
   * Finds node in tree of the current wrapper that matches the provided selector.
   */
  findAll (selector: string | Component) {
    if (!isValidSelector(selector)) {
      throw new Error('wrapper.findAll() must be passed a valid CSS selector or a Vue constructor')
    }

    if (typeof selector === 'object') {
      if (!selector.name) {
        throw new Error('.findAll() requires component to have a name property')
      }
      const vm = this.vm || this.vnode.context.$root
      const components = findVueComponents(vm, selector.name)
      return new WrapperArray(components.map(component => new VueWrapper(component, this.options)))
    }

    function nodeMatchesSelector (node, selector) {
      return node.elm && node.elm.getAttribute && matchesSelector(node.elm, selector)
    }

    const nodes = findMatchingVNodes(this.vnode, selector)
    const matchingNodes = nodes.filter(node => nodeMatchesSelector(node, selector))

    return new WrapperArray(matchingNodes.map(node => new Wrapper(node, this.update, this.options)))
  }

  /**
   * Returns HTML of element as a string
   */
  html (): string {
    const tmp = document.createElement('div')
    tmp.appendChild(this.element)
    return tmp.innerHTML
  }

  /**
   * Checks if node matches selector
   */
  is (selector: string | Component): boolean {
    if (!isValidSelector(selector)) {
      throw new Error('wrapper.is() must be passed a valid CSS selector or a Vue constructor')
    }

    if (typeof selector === 'object') {
      if (!this.isVueComponent) {
        return false
      }
            // TODO: Throw error if component does not have name
      return !!this.vm && this.vm.$vnode.componentOptions.Ctor.options.name === selector.name
    }
    return this.element.getAttribute && matchesSelector(this.element, selector)
  }

  /**
   * Checks if node is empty
   */
  isEmpty (): boolean {
    return this.vnode.children === undefined
  }

  /**
   * Checks if wrapper is a vue instance
   */
  isVueInstance (): boolean {
    return !!this.isVueComponent
  }

  /**
   * Returns name of component, or tag name if node is not a Vue component
   */
  name (): string {
    if (this.isVueComponent && this.vm) {
      return this.vm.$options.name
    }

    return this.vnode.tag
  }

  /**
   * Sets vm data
   */
  setData (data: Object) {
    if (!this.isVueComponent) {
      throw new Error('wrapper.setData() can only be called on a Vue instance')
    }

    Object.keys(data).forEach((key) => {
      // $FlowIgnore : Problem with possibly null this.vm
      this.vm.$set(this.vm, [key], data[key])
    })
    this.update()
  }

  /**
   * Sets vm props
   */
  setProps (data: Object) {
    if (!this.isVueComponent || !this.vm) {
      throw new Error('wrapper.setProps() can only be called on a Vue instance')
    }

    Object.keys(data).forEach((key) => {
      // $FlowIgnore : Problem with possibly null this.vm
      this.vm._props[key] = data[key]
    })
    this.update()
    // $FlowIgnore : Problem with possibly null this.vm
    this.vnode = this.vm._vnode
  }

  /**
   * Return text of wrapper element
   */
  text (): string {
    return this.element.textContent
  }

  /**
   * Dispatches a DOM event on wrapper
   */
  trigger (type: string) {
    if (typeof type !== 'string') {
      throw new Error('wrapper.trigger() must be passed a string')
    }

    const modifiers = {
      enter: 13,
      tab: 9,
      delete: 46,
      esc: 27,
      space: 32,
      up: 38,
      down: 40,
      left: 37,
      right: 39
    }

    const event = type.split('.')

    const eventObject = new window.Event(event[0])

    if (event.length === 2) {
      eventObject.keyCode = modifiers[event[1]]
    }

    this.element.dispatchEvent(eventObject)
    this.update()
  }
}
