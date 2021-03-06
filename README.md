Universal render for React+ [![Build Status](https://travis-ci.org/heroku/create-render-4r.svg?branch=master)](https://travis-ci.org/heroku/create-render-4r)
================================================
[Express.js middleware](http://expressjs.com/en/guide/writing-middleware.html) to render a **4r** app server-side:

  * [React](http://reactjs.com) UI
  * [React Router](https://github.com/rackt/react-router)
  * [Redux](http://redux.js.org) state container
  * [Radium](http://stack.formidable.com/radium/) styles

![Diagram: Universal Web Apps & create-render-4r](https://universal-web-apps.s3.amazonaws.com/universal-web-apps-create-render-4r-v3.png)


Features
--------

  * Drop-in server-side rendering for React+Router+Redux+Radium apps
  * Uses React's rock-solid [`ReactDOMServer.renderToString`](http://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostring) for synchronous rendering
  * Instant re-hydration of app on browser using Redux initial state
  * Set HTML `<head>` content: `<title>` & `meta` elements with [DocumentMeta](https://github.com/kodyl/react-document-meta)
  * Per-component data loading for the current route:
    * [Redux thunk](https://github.com/gaearon/redux-thunk) via [`static fetchData()`](#fetchdata)
    * [Redux sagas](http://yelouafi.github.io/redux-saga) via [`static sagasToRun()`](#sagastorun)
  * Not-ok HTTP responses
    * **301** for React Router's [`<Redirect/>` component](https://github.com/rackt/react-router/blob/latest/docs/guides/basics/RouteConfiguration.md#preserving-urls)
    * **404** for unmatched URLs
    * [`decorateResponse()`](#decorateresponse) with custom status code based on Redux state


[Example Universal Web App](https://github.com/heroku/create-render-4r-example)
----------------------------
Demonstrates using this renderer in a working universal app.


Install
-------

Add the module to `package.json`:
```bash
npm install create-render-4r --save

# Save peer dependencies for production (otherwise they're only dev dependencies):
npm install radium@0.15.x react@0.14.x react-document-meta@2.x react-dom@0.14.x react-redux@4.x react-router@1.x redux@3.x --save
```

### Upgrading

Breaking changes are indicated by major versions. See [UPGRADING](UPGRADING.md)


Usage
-----

Basic usage in an [Express](http://expressjs.com) `server.js`:
```javascript
var express = require('express');
var createRender4r = require('create-render-4r');

var app = express();

// These are unique to your own app.
var routes = require('./my-routes');
var loadStore = require('./my-load-store');
var layoutHtml = require('./my-layout-html');

// Create the render middleware.
var render4r = createRender4r({
  routes:       routes,
  loadStore:    loadStore,
  layoutHtml:   layoutHtml
});

// Add the render for all requests.
app.use(render4r);

var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Server listening on', PORT);
});
```

[Example `server.js`](https://github.com/heroku/create-render-4r-example/blob/master/server/server.js)


API
---

### `createRender4r()`
This function is used to generate the [Express.js middleware](http://expressjs.com/en/guide/writing-middleware.html).

It accepts a single argument, an object:

```javascript
createRender4r({ routes, loadStore, layoutHtml, decorateResponse })
```

#### `routes`
(Required) The [`<Router/>` component](https://github.com/rackt/react-router/blob/latest/docs/guides/basics/RouteConfiguration.md)

#### `loadStore`
(Required) A function taking initial state, returning the Redux store; created with [Redux `createStore`](http://redux.js.org/docs/basics/Store.html)

```javascript
var Redux = require('redux');
var createStore = Redux.createStore;
var combineReducers = Redux.combineReducers;

var reducers = require('./my-reducers');

function loadStore(initialState) {
  return createStore(combineReducers(reducers), initialState);
}
```

#### `layoutHtml`
(Required) An HTML template function; this sample uses ES2015 module & template string syntx:

```javascript
function layoutHtml(componentHTML, cleanInitialState, documentMeta) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${documentMeta}

        <script type="application/javascript">
          window.__INITIAL_STATE__ = ${cleanInitialState};
        </script>
      </head>
      <body>
        <div id="react-view">${componentHTML}</div>

        <script type="application/javascript" src="/bundle.js"></script>
      </body>
    </html>
  `;
}
```

#### `decorateResponse`
(Optional) A side-effect function to update the response based on state:

`decorateResponse(response, state)`

  * `response` (required) the [Express response object](http://expressjs.com/en/4x/api.html#res)
  * `state` (required) the Redux state atom, as returned from `getState()`

```javascript
function decorateResponse(response, state) {
  /*
  Example: set 404 response status when the item couldn't be fetched,
    while the app still renders a nice Not Found message in the UI.
  */
  var errText = state.item.get('error');
  if (errText && /^404/.exec(errText)) {
    response.status(404)
  }
}
```

[Example `createRender4r()`](https://github.com/heroku/create-render-4r-example/blob/master/server/server.js)


### Server-side async data loading

Per-component data loading for the current route.

#### `fetchData()`

Define this static (class) method on React components to enable Promise-based server-side fetching. You'll need to use a universal library like [isomorphic-fetch](https://github.com/niftylettuce/isomorphic-fetch) within [redux-thunk](https://github.com/gaearon/redux-thunk) async action creators so they will work equivalently on the server-side & in web browsers.

`fetchData(dispatch, props)`

  * `dispatch` (required) the Redux store's dispatcher
  * `props` (required) the component's props

Must return a Promise to await completetion of the fetch. (This is what Redux thunk does.)

```javascript
static fetchData(dispatch, props) {
  return dispatch(ItemActions.getItem(props.params.id));
}
```

[Example `fetchData()`](https://github.com/heroku/create-render-4r-example/blob/master/common/components/screens/home.js)

#### `sagasToRun()`

Define this static (class) method on React components to enable Generator-based server-side fetching via [Redux sagas](http://yelouafi.github.io/redux-saga).

`sagasToRun(dispatch, props)`

  * `dispatch` (required) the Redux store's dispatcher
  * `props` (required) the component's props

Must return an array of arrays of arguments for [`middleware.run`](http://yelouafi.github.io/redux-saga/docs/api/index.html#middlewarerunsaga-args).

```javascript
static sagasToRun(dispatch, props) {
  return [
    [fetchThingsSaga],
    [verifyAuthSaga, { userId: props.params.authUserId }]
  ];
}
```

Additionally, the Redux store returned by [`loadStore()`](#loadstore) must expose the Saga middleware as `store.sagaMiddleware`:

```javascript
// …
import createSagaMiddleware       from 'redux-saga';
// …

export default function loadStore(...createStoreRestParams) {
  const sagaMiddleware            = createSagaMiddleware(...sagas);
  // …
  // This accessor must be added for Saga middleware to be used server-side:
  store.sagaMiddleware            = sagaMiddleware;
  return store;
}
```

### Absolute URLs

Frequently, app code will need its absolute URL, canonical hostname & protocol to **render links** or **make API requests**.

This module includes a `sourceRequest` reducer to handle this state. [It is captured on the server for each request](https://github.com/heroku/create-render-4r/blob/master/index.js#L42) as the Redux store is initialized.

Example `state.sourceRequest.host` values:

* `localhost:3000`
* `example.com`
* `api.example.com:8443`
* `velvet-glacier-1234.herokuapp.com`

Example `state.sourceRequest.protocol` values:

* `https`
* `http`

To use these values in an app:

1. Add this module's reducers to your store:
  ```javascript
  import { combineReducers } from 'redux'
  import { reducers as cr4rReducers } from 'create-render-4r'

  const rootReducer = combineReducers(
    Object.assign(
      cr4rReducers,
      // …& the app's reducers
    )
  )
  ```
  
  [Example `reducers/index.js`](https://github.com/heroku/create-render-4r-example/blob/master/common/reducers/index.js)
1. Then access it in the Redux state:
  ```javascript
  // `store` is the Redux store
  const state = store.getState();
  const proto = state.sourceRequest.protocol;
  const host = state.sourceRequest.host;
  ```

  [Example `actions/counter.js`](https://github.com/heroku/create-render-4r-example/blob/master/common/actions/counter.js)
