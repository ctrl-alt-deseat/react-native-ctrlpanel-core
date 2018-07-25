# React Native bridge for `@ctrlpanel/core`

Wraps `@ctrlpanel/core` in a WebView and bridges the API. This is needed since `@ctrlpanel/core` depends on WebCrypto which is not supported by React Native.

## Installation

```sh
npm install --save react-native-ctrlpanel-core
```

## Usage

```js
import React, { Component } from 'react'
import { View } from 'react-native'
import CtrlpanelCore from 'react-native-ctrlpanel-core'

class App extends Component {
  constructor (props) {
    super(props)
    this.core = React.createRef()
  }

  componentDidMount () {
    // The API is now available at:
    this.core.current
  }

  render () {
    return (
      <View>
        <CtrlpanelCore ref={this.core} />

        {/* Render your app here */}
      </View>
    )
  }
}
```
