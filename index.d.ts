import { Component } from 'react'

export interface Account {
  handle: string
  hostname: string
  password: string
}

export interface InboxEntry {
  hostname: string
  email: string
}

export interface ParsedEntries {
  accounts: { [key: string]: Account }
  inbox: { [key: string]: InboxEntry }
}

export interface AccountMatch extends Account {
  id: string
  score: number
}

export type PaymentInformation = (
  { type: 'apple', transactionIdentifier: string } |
  { type: 'stripe', email: string, plan: string, token: string }
)

export type SubscriptionStatus = (
  'trialing' |
  'active' |
  'past_due' |
  'canceled' |
  'unpaid'
)

export type State = (
  { kind: 'empty' } |
  { kind: 'locked', handle: string, secretKey: string, syncToken: string } |
  { kind: 'unlocked', handle: string, parsedEntries: ParsedEntries, secretKey: string, syncToken: string } |
  { kind: 'connected', handle: string, parsedEntries: ParsedEntries, hasPaymentInformation: boolean, secretKey: string, subscriptionStatus: SubscriptionStatus, syncToken: string, trialDaysLeft: number }
)

export default class CtrlpanelCore extends Component {
  currentState: State

  handle: string | undefined
  secretKey: string | undefined
  syncToken: string | undefined
  hasAccount: boolean
  locked: boolean
  parsedEntries: ParsedEntries | undefined

  addEventListener (event: 'update', fn: () => void): void

  randomAccountPassword (): Promise<string>
  randomHandle (): Promise<string>
  randomMasterPassword (): Promise<string>
  randomSecretKey (): Promise<string>

  lock (): Promise<void>
  reset (syncToken: string): Promise<void>
  signup (handle: string, secretKey: string, masterPassword: string): Promise<void>
  login (handle: string, secretKey: string, masterPassword: string): Promise<void>
  unlock (masterPassword: string): Promise<void>
  connect (): Promise<void>
  sync (): Promise<void>
  setPaymentInformation (paymentInformation: PaymentInformation): Promise<void>

  accountsForHostname (hostname: string): Promise<AccountMatch[]>

  createAccount (id: string, data: Account): Promise<void>
  deleteAccount (id: string): Promise<void>
  updateAccount (id: string, data: Account): Promise<void>
  createInboxEntry (id: string, data: InboxEntry): Promise<void>
  deleteInboxEntry (id: string): Promise<void>

  importFromDeseatme (exportToken: string): Promise<void>

  clearStoredData (): Promise<void>
  deleteUser (): Promise<void>
}
