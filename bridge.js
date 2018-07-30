const React = require('react')
const { AsyncStorage, StyleSheet, View, WebView } = require('react-native')

const encodeUtf8 = require('encode-utf8')
const base64 = require('base64-js')

/**
 * @param {string} input
 */
function encodeBase64 (input) {
  return base64.fromByteArray(new Uint8Array(encodeUtf8(input)))
}

const styles = StyleSheet.create({
  hide: {
    display: 'none',
    position: 'absolute',

    width: 0,
    height: 0,

    flexGrow: 0,
    flexShrink: 1
  }
})

const internalLibrary = `
(function () {
  function postMessage (message) {
    if (window.postMessage.length !== 1) {
      setTimeout(postMessage, 200, message)
    } else {
      window.postMessage(JSON.stringify(message))
    }
  }

  function serializeError (value) {
    return (typeof value !== 'object' || value === null) ? {} : {
      name: String(value.name),
      message: String(value.message),
      stack: String(value.stack),
      line: Number(value.line),
      column: Number(value.column),
      code: value.code,
    }
  }

  function callFunction (id, fnFactory, ...args) {
    Promise.resolve().then(() => {
      return fnFactory()(...args)
    }).then((result) => {
      postMessage({ id, type: 'resolve', result })
    }, (err) => {
      postMessage({ id, type: 'reject', error: serializeError(err) })
    })
  }

  window.addEventListener('error', function (e) {
    let error

    if (e.error) {
      error = serializeError(e.error)
    } else {
      error = { name: 'Error', message: e.message, stack: e.filename + ':' + e.lineno + ':' + e.colno, line: e.lineno, column: e.colno }
    }

    postMessage({ type: 'error', error })
  })

  window.document.addEventListener('message', function (e) {
    try {
      const msg = JSON.parse(e.data)

      callFunction(msg.id, () => eval(msg.name), ...msg.args)
    } catch (err) {
      postMessage({ type: 'error', error: serializeError(err) })
    }
  })

  let asyncStorageRequestId = 0
  const asyncStorageHandlers = new Map()

  function asyncStorageCall (fn, args) {
    return new Promise((resolve, reject) => {
      const id = asyncStorageRequestId++

      asyncStorageHandlers.set(id, { resolve, reject })
      postMessage({ type: 'async-storage', id, fn, args })
    })
  }

  function asyncStorageResponse (msg) {
    if (msg.type === 'resolve') {
      asyncStorageHandlers.get(msg.id).resolve(msg.result)
    } else {
      asyncStorageHandlers.get(msg.id).reject(Object.assign(new Error(), msg.error))
    }
  }

  const AsyncStorage = {
    getItem (...args) { return asyncStorageCall('getItem', args) },
    setItem (...args) { return asyncStorageCall('setItem', args) },
    removeItem (...args) { return asyncStorageCall('removeItem', args) },
    mergeItem (...args) { return asyncStorageCall('mergeItem', args) },
    clear (...args) { return asyncStorageCall('clear', args) },
    getAllKeys (...args) { return asyncStorageCall('getAllKeys', args) },
    flushGetRequests (...args) { asyncStorageCall('flushGetRequests', args) },
    multiGet (...args) { return asyncStorageCall('multiGet', args) },
    multiSet (...args) { return asyncStorageCall('multiSet', args) },
    multiRemove (...args) { return asyncStorageCall('multiRemove', args) },
    multiMerge (...args) { return asyncStorageCall('multiMerge', args) },
  }

  window.ReactNativeShim = { AsyncStorage }
}())
`

const kCurrentIndex = Symbol('current-index')
const kHandlers = Symbol('handlers')
const kReady = Symbol('ready')
const kSignalReady = Symbol('signal-ready')
const kWebView = Symbol('web-view')

/**
 * @typedef {Object} BridgeProps
 * @property {string} libraryCode
 */

/**
 * @typedef {Object} Handler
 * @property {(value: any) => void} resolve
 * @property {(error: Error) => void} reject
 */

/**
 * @extends React.Component<BridgeProps>
 * @member {number} [kCurrentIndex]
 * @member {Map<number, Handler>} [kHandlers]
 * @member {Promise<void>} [kReady]
 * @member {() => void} [kSignalReady]
 * @member {React.RefObject<WebView>} [kWebView]
 */
class Bridge extends React.Component {
  /**
   * @param {BridgeProps} props
   */
  constructor (props) {
    super(props)

    this[kCurrentIndex] = 0
    this[kHandlers] = new Map()
    this[kReady] = new Promise((resolve) => { this[kSignalReady] = resolve })
    this[kWebView] = React.createRef()
  }

  /**
   * @param {string} source
   */
  handleMessage (source) {
    const msg = JSON.parse(source)

    switch (msg.type) {
      case 'error':
        console.error(Object.assign(new Error(), msg.error))
        break
      case 'resolve':
        this[kHandlers].get(msg.id).resolve(msg.result)
        break
      case 'reject':
        this[kHandlers].get(msg.id).reject(Object.assign(new Error(), msg.error))
        break
      case 'async-storage':
        Promise.resolve(AsyncStorage[msg.fn](...msg.args)).then(
          (result) => this.callFunction('asyncStorageResponse', { type: 'resolve', id: msg.id, result }),
          (err) => this.callFunction('asyncStorageResponse', { type: 'reject', id: msg.id, error: { name: err.name, message: err.message } }),
        )
        break
      default:
        console.warn('Unknown message type: ' + msg.type)
    }
  }

  /**
   * @param {string} name
   * @param {any[]} args
   */
  callFunction (name, ...args) {
    return new Promise((resolve, reject) => {
      const id = this[kCurrentIndex]++

      this[kHandlers].set(id, { resolve, reject })
      this[kReady].then(() => this[kWebView].current.postMessage(JSON.stringify({ id, name, args })))
    })
  }

  render () {
    // The uri 'about:blank' doesn't have access to crypto.subtle
    const uri = 'file:///android_asset/blank.html'

    // Base64 dance is to work around https://github.com/facebook/react-native/issues/20365
    const code = `((function () {${internalLibrary};${this.props.libraryCode}})())`
    const injectString = `eval(window.atob('${encodeBase64(code)}'))`

    const webView = React.createElement(WebView, {
      domStorageEnabled: true,
      injectedJavaScript: injectString,
      javaScriptEnabled: true,
      mixedContentMode: 'compatibility',
      onError: (a) => console.error(a),
      onLoad: () => this[kSignalReady](),
      onMessage: (ev) => this.handleMessage(ev.nativeEvent.data),
      ref: this[kWebView],
      source: { uri },
      style: styles.hide,
    })

    return React.createElement(View, { style: styles.hide }, webView)
  }
}

module.exports = Bridge
