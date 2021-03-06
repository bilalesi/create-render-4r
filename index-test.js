import test from 'ava';
import createRender4r, { actions, reducers } from '.';

test('Exports default createRender4r', t => {
  t.is(typeof createRender4r, 'function');
});

test('Exports actions', t => {
  t.is(typeof actions, 'object');
  t.is(typeof actions.sourceRequest, 'object');
});

test('Exports reducers', t => {
  t.is(typeof reducers, 'object');
  t.is(typeof reducers.sourceRequest, 'function');
});

test('Throws error without routes', t => {
  t.throws(() => {
    createRender4r({
      routes: null,
      loadStore: () => {},
      layoutHtml: () => {}
    });
  });
});

test('Throws error without loadStore', t => {
  t.throws(() => {
    createRender4r({
      routes: {},
      loadStore: null,
      layoutHtml: () => {}
    });
  });
});

test('Throws error without layoutHtml', t => {
  t.throws(() => {
    createRender4r({
      routes: {},
      loadStore: () => {},
      layoutHtml: null
    });
  });
});

test('Creates a function', t => {
  const render = createRender4r({
    routes: {},
    loadStore: () => {},
    layoutHtml: () => {}
  });
  t.is(typeof render, 'function');
});
