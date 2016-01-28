Server-side render for React+Router+Redux+Radium (4r)
================================================
Creates an Express.js handler function to render the app.

Features
--------

  * Composed of "4r"
    * [React UI](http://reactjs.com)
      * synchronous rendering of the app's HTML
    * [React Router](https://github.com/rackt/react-router)
      * matches the component tree to URLs
    * [Redux state container](http://redux.js.org)
      * serializes & sanitizes initial state for the web browser
      * initial state can influence the HTTP response
      * response decoration based on initial state via [`decorateResponse()`](#createRender4r)
        * e.g. set response status **404** if `fetchData()` returns **404**
    * [Radium styles](http://stack.formidable.com/radium/)
      * [autoprefixes CSS](https://github.com/formidablelabs/radium/tree/master/docs/api#configuseragent) based on HTTP "User-Agent" header
  * [DocumentMeta](https://github.com/kodyl/react-document-meta)
    * set HTML `title` & `meta` elements
  * Async data loading via `static fetchData()` defined on components within current route
  * Not-ok HTTP responses
    * **301** for React Router's [`<Redirect/>` component](https://github.com/rackt/react-router/blob/latest/docs/guides/basics/RouteConfiguration.md#preserving-urls)
    * **404** for unmatched URLs

Usage
-----
[Example app](example) demonstrates using this renderer in a working Universal app.

Here's a sample setup, with details following:

```javascript
var express = require('express');
var createRender4r = require('create-render-4r');

var app = express();

// These are unique to your own app.
var routes = require('./my-routes');
var createStore = require('./my-create-store');
var layoutHtml = require('./my-layout-html');

// Create the renderer.
var render4r = createRender4r({
  routes:       routes,
  createStore:  createStore,
  layoutHtml:   layoutHtml
});

// Add the render for all requests.
app.use(render4r);

var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('Server listening on', PORT);
});
```

### `createRender4r()`
This function is used to generate the Express.js handler. It accepts a single object argument with the properties:

  * `routes` (required) the [`<Router/>` component](https://github.com/rackt/react-router/blob/latest/docs/guides/basics/RouteConfiguration.md)
  * `createStore` (required) the [`createStore()` function](http://redux.js.org/docs/basics/Store.html)
  * `layoutHtml` (required) an HTML template function; this sample uses ES2015 module & template string syntx:
  
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
  * `decorateResponse` (optional) a side-effect function to update the response based on state:
     
    ```javascript
function decorateResponse(res, state) {
  /*
  Example: set 404 response status when the item couldn't be fetched,
    while the app still renders a nice Not Found message in the UI.
  */
  var errText = state.item.get('error');
  if (errText && /^404/.exec(errText)) { res.status(404) }
}
    ```

### `fetchData()`
Define this static (class) method on React components to enable server-side fetching. You'll need to use a universal library like [isomporphic-fetch](https://github.com/niftylettuce/isomorphic-fetch) within [redux-thunk](https://github.com/gaearon/redux-thunk) async action creators so they will work equivalently on the server-side & in web browsers.

```javascript
static fetchData(dispatch, props) {
  return dispatch(ItemActions.getItem(props.params.id));
}
```

