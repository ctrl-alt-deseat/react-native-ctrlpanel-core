import CtrlpanelCore from '@ctrlpanel/core'
import findAccountsForHostname from '@ctrlpanel/find-accounts-for-hostname'
import FannyPackReactNative from '@fanny-pack/react-native'

/** @type {CtrlpanelCore} */
let core = null
let state = null

function jsonState (state) {
  let result = {}

  if (state.kind != null) result.kind = state.kind

  // Locked
  if (state.handle != null) result.handle = state.handle
  if (state.secretKey != null) result.secretKey = state.secretKey
  if (state.handle != null && state.secretKey != null) result.syncToken = core.getSyncToken(state)

  // Unlocked
  if (state.decryptedEntries != null) {
    result.parsedEntries = core.getParsedEntries(state)
  }

  // Connected
  if (state.hasPaymentInformation != null) result.hasPaymentInformation = state.hasPaymentInformation
  if (state.subscriptionStatus != null) result.subscriptionStatus = state.subscriptionStatus
  if (state.trialDaysLeft != null) result.trialDaysLeft = state.trialDaysLeft

  return result
}

window['Ctrlpanel'] = {
  randomAccountPassword () {
    return CtrlpanelCore.randomAccountPassword()
  },
  randomHandle () {
    return CtrlpanelCore.randomHandle()
  },
  randomMasterPassword () {
    return CtrlpanelCore.randomMasterPassword()
  },
  randomSecretKey () {
    return CtrlpanelCore.randomSecretKey()
  },

  boot (apiHost, deseatmeApiHost) {
    if (apiHost == null) apiHost = undefined
    if (deseatmeApiHost == null) deseatmeApiHost = undefined

    const storage = new FannyPackReactNative('ctrlpanel')

    core = new CtrlpanelCore({ apiHost, deseatmeApiHost, storage })
  },
  async init (syncToken) {
    if (syncToken == null) syncToken = undefined

    return jsonState(state = await core.init(syncToken))
  },
  lock () {
    return jsonState(state = core.lock(state))
  },

  async signup (handle, secretKey, masterPassword) {
    return jsonState(state = await core.signup(state, { handle, secretKey, masterPassword }))
  },
  async login (handle, secretKey, masterPassword) {
    const connectedState = await core.login(state, { handle, secretKey, masterPassword })
    return jsonState(state = await core.sync(connectedState))
  },
  async unlock (masterPassword) {
    let nextState = await core.unlock(state, { masterPassword })

    /*
      A connected state means that we did not make an offline login, which means that no data have
      been synced to this device yet. In order not to flash an empty state, we run a sync together
      with this unlock action.
      */
    if (nextState.kind === 'connected') {
      nextState = await core.sync(nextState)
    }

    return jsonState(state = nextState)
  },
  async connect () {
    return jsonState(state = await core.connect(state))
  },
  async sync () {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error(`Invalid state: ${state.kind}`)

    const nextState = await core.sync(state)

    if (state.kind !== 'unlocked' && state.kind !== 'connected') {
      throw Object.assign(new Error('Sync aborted'), { code: 'LOCKED_DURING_SYNC' })
    }

    return jsonState(state = nextState)
  },

  async setPaymentInformation (paymentInformation) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error(`Invalid state: ${state.kind}`)

    return jsonState(state = await core.setPaymentInformation(state, paymentInformation))
  },

  accountsForHostname (hostname) {
    const { accounts } = core.getParsedEntries(state)
    const accountList = Object.keys(accounts).map(id => Object.assign({ id }, accounts[id]))

    return findAccountsForHostname(hostname, accountList)
  },

  async createAccount (id, account) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.createAccount(state, id.toLowerCase(), account))
  },
  async deleteAccount (id) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.deleteAccount(state, id.toLowerCase()))
  },
  async updateAccount (id, account) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.updateAccount(state, id.toLowerCase(), account))
  },
  async createInboxEntry (id, inboxEntry) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.createInboxEntry(state, id.toLowerCase(), inboxEntry))
  },
  async deleteInboxEntry (id) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.deleteInboxEntry(state, id.toLowerCase()))
  },
  async importFromDeseatme (exportToken) {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error('Vault is locked')

    return jsonState(state = await core.importFromDeseatme(state, exportToken))
  },

  async clearStoredData () {
    return jsonState(state = await core.clearStoredData(state))
  },
  async deleteUser () {
    return jsonState(state = await core.deleteUser(state))
  }
}
