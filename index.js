const React = require('react')

const Bridge = require('./bridge')
const libraryCode = require('./compiled')

/**
 * @typedef {Object} CtrlpanelCoreProps
 * @property {string} [apiHost]
 * @property {string} [deseatmeApiHost]
 * @property {string} [syncToken]
 */

const kListeners = Symbol('listeners')
const kReady = Symbol('ready')
const kRef = Symbol('ref')
const kSignalReady = Symbol('signal-ready')
const kState = Symbol('state')

class CtrlpanelCore extends React.Component {
  /**
   * @param {CtrlpanelCoreProps} props
   */
  constructor (props) {
    super(props)

    this[kListeners] = new Set()
    this[kRef] = React.createRef()
    this[kReady] = new Promise((resolve) => { this[kSignalReady] = resolve })
    this[kState] = { kind: 'empty' }
  }

  addEventListener (event, fn) {
    if (event !== 'update') throw new Error(`Unknown event: ${event}`)
    this[kListeners].add(fn)
  }

  componentDidMount () {
    this[kSignalReady]((async () => {
      const api = this[kRef].current

      await api.callFunction('Ctrlpanel.boot', this.props.apiHost, this.props.deseatmeApiHost)
      this[kState] = await api.callFunction('Ctrlpanel.init', this.props.syncToken)
      this[kListeners].forEach(fn => fn())
    })())
  }

  render () {
    return React.createElement(Bridge, { ref: this[kRef], libraryCode })
  }

  /**** PUBLIC API ****/

  get currentState () {
    return this[kState]
  }

  get handle () {
    switch (this[kState].kind) {
      case 'empty': return undefined
      case 'locked': return this[kState].handle
      case 'unlocked': return this[kState].handle
      case 'connected': return this[kState].handle
    }
  }

  get secretKey () {
    switch (this[kState].kind) {
      case 'empty': return undefined
      case 'locked': return this[kState].secretKey
      case 'unlocked': return this[kState].secretKey
      case 'connected': return this[kState].secretKey
    }
  }

  get syncToken () {
    switch (this[kState].kind) {
      case 'empty': return undefined
      case 'locked': return this[kState].syncToken
      case 'unlocked': return this[kState].syncToken
      case 'connected': return this[kState].syncToken
    }
  }

  get hasAccount () {
    switch (this[kState].kind) {
      case 'empty': return false
      case 'locked': return true
      case 'unlocked': return true
      case 'connected': return true
    }
  }

  get locked () {
    switch (this[kState].kind) {
      case 'empty': return true
      case 'locked': return true
      case 'unlocked': return false
      case 'connected': return false
    }
  }

  get parsedEntries () {
    switch (this[kState]) {
      case 'empty': return undefined
      case 'locked': return undefined
      case 'unlocked': return this[kState].parsedEntries
      case 'connected': return this[kState].parsedEntries
    }
  }

  randomAccountPassword () {
    return this[kReady].then(() => this[kRef].current.callFunction('Ctrlpanel.randomAccountPassword'))
  }

  randomHandle () {
    return this[kReady].then(() => this[kRef].current.callFunction('Ctrlpanel.randomHandle'))
  }

  randomMasterPassword () {
    return this[kReady].then(() => this[kRef].current.callFunction('Ctrlpanel.randomMasterPassword'))
  }

  randomSecretKey () {
    return this[kReady].then(() => this[kRef].current.callFunction('Ctrlpanel.randomSecretKey'))
  }

  async lock() {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.lock')
    this[kListeners].forEach(fn => fn())
  }

  async reset(syncToken) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.init', syncToken)
    this[kListeners].forEach(fn => fn())
  }

  async signup (handle, secretKey, masterPassword) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.signup', handle, secretKey, masterPassword)
    this[kListeners].forEach(fn => fn())
  }

  async login (handle, secretKey, masterPassword) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.login', handle, secretKey, masterPassword)
    this[kListeners].forEach(fn => fn())
  }

  async unlock (masterPassword) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.unlock', masterPassword)
    this[kListeners].forEach(fn => fn())
  }

  async connect () {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.connect')
    this[kListeners].forEach(fn => fn())
  }

  async sync () {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.sync')
    this[kListeners].forEach(fn => fn())
  }

  async setPaymentInformation (paymentInformation) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.setPaymentInformation', paymentInformation)
    this[kListeners].forEach(fn => fn())
  }

  async accountsForHostname (hostname) {
    const api = await this[kReady].then(() => this[kRef].current)
    return api.callFunction('Ctrlpanel.accountsForHostname', hostname)
  }

  async createAccount (id, data) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.createAccount', id, data)
    this[kListeners].forEach(fn => fn())
  }

  async deleteAccount (id) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.deleteAccount', id)
    this[kListeners].forEach(fn => fn())
  }

  async updateAccount (id, data) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.updateAccount', id, data)
    this[kListeners].forEach(fn => fn())
  }

  async createInboxEntry (id, data) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.createInboxEntry', id, data)
    this[kListeners].forEach(fn => fn())
  }

  async deleteInboxEntry (id) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.deleteInboxEntry', id)
    this[kListeners].forEach(fn => fn())
  }

  async importFromDeseatme (exportToken) {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.importFromDeseatme', exportToken)
    this[kListeners].forEach(fn => fn())
  }

  async clearStoredData () {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.clearStoredData')
    this[kListeners].forEach(fn => fn())
  }

  async deleteUser () {
    const api = await this[kReady].then(() => this[kRef].current)
    this[kState] = await api.callFunction('Ctrlpanel.deleteUser')
    this[kListeners].forEach(fn => fn())
  }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.default = CtrlpanelCore
