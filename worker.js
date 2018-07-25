import CtrlpanelCore from '@ctrlpanel/core'
import findAccountsForHostname from '@ctrlpanel/find-accounts-for-hostname'
import FannyPackMemory from '@fanny-pack/memory'

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

    const storage = new FannyPackMemory()

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
    return jsonState(state = await core.login(state, { handle, secretKey, masterPassword }))
  },
  async unlock (masterPassword) {
    return jsonState(state = await core.unlock(state, masterPassword))
  },
  async connect () {
    return jsonState(state = await core.connect(state))
  },
  async sync () {
    if (state.kind === 'unlocked') await window['Ctrlpanel'].connect()
    if (state.kind !== 'connected') throw new Error(`Invalid state: ${state.kind}`)

    return jsonState(state = await core.sync(state))
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
