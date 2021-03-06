import { compileToFunctions } from 'vue-template-compiler'
import shallow from '../../../../../src/shallow'

describe('findAll', () => {
  it('throws an error', () => {
    const compiled = compileToFunctions('<div />')
    const wrapper = shallow(compiled)
    const message = 'findAll() is not currently supported in shallow render'
    expect(() => wrapper.findAll()).to.throw(Error, message)
  })
})
