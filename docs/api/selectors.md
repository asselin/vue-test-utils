# Selectors

A lot of avoriaz methods take a selector as an argument. A selector can either be a CSS selector, or a Vue component.

## CSS Selectors

mount handles any valid CSS selector:

- tag selectors (div, foo, bar)
- class selectors (.foo, .bar)
- attribute selectors ([foo], [foo="bar"])
- id selectors (#foo, #bar)
- pseudo selectors (div:first-of-type)

You can also use combinators:

- direct descendant combinator (div > #bar > .foo)
- general descendant combinator (div #bar .foo)
- adjacent sibling selector (div + .foo)
- general sibling selector (div ~ .foo)

## Vue Components

Vue components are also valid selectors.

vue-test-utils uses the `name` property to search the instance tree for matching Vue components.

### Example

```js
// Foo.vue

export default{
  name: 'Foo',
};
```

```js
import Foo from './Foo.vue';
const wrapper = mount(Foo);

expect(wrapper.is(Foo)).to.equal(true);
```
