(() => {
    const PROXY_FLAG = Symbol('resonantProxy');
    const OBJECT_KEY = new WeakMap();
    const _RES_EVENTS = ['click', 'dblclick', 'input', 'change', 'keydown', 'keyup', 'keypress', 'submit', 'blur', 'focus', 'mousedown', 'mouseup'];

    function isObject(val) {
        return val !== null && typeof val === 'object';
    }
    function isNumericProp(prop) {
        if (typeof prop === 'number') return true;
        if (typeof prop !== 'string') return false;
        const n = Number(prop);
        return Number.isInteger(n) && String(n) === prop;
    }

    class ObservableArray {
        constructor(variableName, resonantInstance, ...args) {
            const base = Array.from(args);
            const proxy = ObservableArray._createArrayProxy(base, variableName, resonantInstance, '');
            return proxy;
        }

        static _ensureKey(target, resonant) {
            if (!isObject(target)) return;
            if (!OBJECT_KEY.has(target)) {
                const id = `${resonant._nextKeyId++}`;
                OBJECT_KEY.set(target, id);
            }
            if (!Object.prototype.hasOwnProperty.call(target, 'key')) {
                try {
                    Object.defineProperty(target, 'key', {
                        get() { return OBJECT_KEY.get(target); },
                        enumerable: false,
                        configurable: false
                    });
                } catch (_) {}
            }
        }

        static _ensureKeysRecursive(value, resonant, _seen) {
            if (!isObject(value)) return value;
            if (!_seen) _seen = new Set();
            if (_seen.has(value)) return value;
            _seen.add(value);
            if (Array.isArray(value)) {
                value.forEach(v => ObservableArray._ensureKeysRecursive(v, resonant, _seen));
                return value;
            }
            ObservableArray._ensureKey(value, resonant);
            Object.keys(value).forEach(k => {
                ObservableArray._ensureKeysRecursive(value[k], resonant, _seen);
            });
            return value;
        }

        static _wrapAny(value, rootName, resonant, path) {
            if (!isObject(value)) return value;
            if (value[PROXY_FLAG]) return value;

            if (Array.isArray(value)) {
                return ObservableArray._createArrayProxy(value.slice(), rootName, resonant, path);
            }
            return resonant._createObject(rootName, value, path);
        }

        static _createArrayProxy(target, rootName, resonant, path) {
            try {
                Object.defineProperty(target, PROXY_FLAG, { value: true, enumerable: false });
            } catch (_) {}

            for (let i = 0; i < target.length; i++) {
                const item = target[i];
                if (isObject(item)) {
                    ObservableArray._ensureKeysRecursive(item, resonant);
                }
                target[i] = ObservableArray._wrapAny(item, rootName, resonant, path ? `${path}.${i}` : `${i}`);
            }

            const isNestedArray = !!(path && String(path).length);
            const notifyAdded = (item, index) => {
                const action = isNestedArray ? 'modified' : 'added';
                resonant._queueUpdate(rootName, action, item, null, undefined, index, path);
            };
            const notifyRemoved = (item, index) => {
                const action = isNestedArray ? 'modified' : 'removed';
                resonant._queueUpdate(rootName, action, item, null, undefined, index, path);
            };
            const notifyModified = (item, index, oldValue, property = null) => {
                resonant._queueUpdate(rootName, 'modified', item, property, oldValue, index, path);
            };
            const notifyUpdated = (payloadItem = null) => {

                const action = isNestedArray ? 'modified' : 'updated';
                const itemForCallback = payloadItem !== null ? payloadItem : target;
                resonant._queueUpdate(rootName, action, itemForCallback, null, undefined, null, path);
            };

            const handler = {
                get(t, prop, receiver) {
                    if (prop === PROXY_FLAG) return true;
                    if (prop === 'bindByCssSelector') {
                        return (cssSelector) => resonant.bindByCssSelector(rootName, cssSelector);
                    }
                    if (prop === 'length') return Reflect.get(t, prop, receiver);

                    if (prop === 'set') {
                        return (index, value) => {
                            const idx = Number(index);
                            const oldValue = t[idx];
                            const wrapped = ObservableArray._wrapAny(value, rootName, resonant, path ? `${path}.${idx}` : `${idx}`);
                            ObservableArray._ensureKeysRecursive(wrapped, resonant);
                            t[idx] = wrapped;
                            notifyModified(t[idx], idx, oldValue);
                            return true;
                        };
                    }

                    if (prop === 'delete') {
                        return (index) => {
                            const idx = Number(index);
                            if (!Object.prototype.hasOwnProperty.call(t, idx)) return true;
                            const old = t[idx];
                            Array.prototype.splice.call(t, idx, 1);
                            notifyRemoved(old, idx);
                            return true;
                        };
                    }

                    if (prop === 'update') {
                        return (array) => {
                            const newArr = Array.isArray(array) ? array : [];
                            for (let i = t.length - 1; i >= 0; i--) {
                                const old = t[i];
                                t.splice(i, 1);
                                notifyRemoved(old, i);
                            }
                            const wrappedItems = newArr.map((it, i) => {
                                const w = ObservableArray._wrapAny(it, rootName, resonant, path ? `${path}.${i}` : `${i}`);
                                ObservableArray._ensureKeysRecursive(w, resonant);
                                return w;
                            });
                            Array.prototype.push.apply(t, wrappedItems);
                            wrappedItems.forEach((it, i) => notifyAdded(it, i));
                            notifyUpdated(array);
                        };
                    }

                    if (prop === 'filterInPlace') {
                        return (predicate) => {
                            const filtered = t.filter(predicate);
                            for (let i = t.length - 1; i >= 0; i--) {
                                const old = t[i];
                                t.splice(i, 1);
                                notifyRemoved(old, i);
                            }
                            const wrapped = filtered.map((it, i) => {
                                const w = ObservableArray._wrapAny(it, rootName, resonant, path ? `${path}.${i}` : `${i}`);
                                ObservableArray._ensureKeysRecursive(w, resonant);
                                return w;
                            });
                            Array.prototype.push.apply(t, wrapped);
                            wrapped.forEach((it, i) => notifyAdded(it, i));
                            notifyUpdated();
                            return filtered;
                        };
                    }

                    if (prop === 'forceUpdate') {
                        return () => {
                            ObservableArray._ensureKeysRecursive(t, resonant);
                            notifyUpdated();
                        };
                    }

                    const arrMethods = {
                        push: (...args) => {
                            const startLen = t.length;
                            const wrapped = args.map((it, i) => {
                                const w = ObservableArray._wrapAny(it, rootName, resonant, path ? `${path}.${startLen + i}` : `${startLen + i}`);
                                ObservableArray._ensureKeysRecursive(w, resonant);
                                return w;
                            });
                            const result = Array.prototype.push.apply(t, wrapped);
                            wrapped.forEach((item, i) => notifyAdded(item, startLen + i));
                            return result;
                        },
                        pop: () => {
                            if (!t.length) return undefined;
                            const idx = t.length - 1;
                            const old = Array.prototype.pop.call(t);
                            notifyRemoved(old, idx);
                            return old;
                        },
                        unshift: (...args) => {
                            const wrapped = args.map((it, i) => {
                                const w = ObservableArray._wrapAny(it, rootName, resonant, path ? `${path}.${i}` : `${i}`);
                                ObservableArray._ensureKeysRecursive(w, resonant);
                                return w;
                            });
                            const result = Array.prototype.unshift.apply(t, wrapped);
                            wrapped.forEach((item, i) => notifyAdded(item, i));
                            return result;
                        },
                        shift: () => {
                            if (!t.length) return undefined;
                            const old = Array.prototype.shift.call(t);
                            notifyRemoved(old, 0);
                            return old;
                        },
                        splice: (start, deleteCount, ...items) => {
                            const s = Number(start) || 0;
                            const dc = deleteCount === undefined ? (t.length - s) : Number(deleteCount);
                            const removed = t.slice(s, s + dc);
                            const wrapped = items.map((it, i) => {
                                const w = ObservableArray._wrapAny(it, rootName, resonant, path ? `${path}.${s + i}` : `${s + i}`);
                                ObservableArray._ensureKeysRecursive(w, resonant);
                                return w;
                            });
                            const res = Array.prototype.splice.call(t, s, dc, ...wrapped);
                            removed.forEach((item, i) => notifyRemoved(item, s + i));
                            wrapped.forEach((item, i) => notifyAdded(item, s + i));
                            return res;
                        },
                        sort: (cmp) => {
                            Array.prototype.sort.call(t, cmp);
                            return receiver;
                        },
                        reverse: () => {
                            Array.prototype.reverse.call(t);
                            return receiver;
                        },
                        filter: (fn, actuallyFilter = true) => {
                            const result = Array.prototype.filter.call(t, fn);
                            if (actuallyFilter) {
                                resonant._queueUpdate(rootName, 'filtered', undefined, null, undefined, null, path);
                            }
                            return result;
                        }
                    };

                    if (prop in arrMethods) {
                        return arrMethods[prop];
                    }

                    if (typeof prop === 'symbol' && prop === Symbol.iterator) {
                        return t[Symbol.iterator].bind(t);
                    }

                    if (isNumericProp(prop)) {
                        return Reflect.get(t, prop, receiver);
                    }

                    const val = Reflect.get(t, prop, receiver);
                    if (typeof val === 'function') {
                        return val.bind(t);
                    }
                    return val;
                },

                set(t, prop, value, receiver) {
                    if (prop === 'length') {
                        const newLen = Number(value);
                        if (!Number.isInteger(newLen) || newLen < 0) return false;
                        if (newLen < t.length) {
                            const removed = t.slice(newLen);
                            Reflect.set(t, prop, value, receiver);
                            removed.forEach((item, i) => notifyRemoved(item, newLen + i));
                            return true;
                        }
                        return Reflect.set(t, prop, value, receiver);
                    }

                    if (isNumericProp(prop)) {
                        const idx = Number(prop);
                        const oldValue = t[idx];
                        const wrapped = ObservableArray._wrapAny(value, rootName, resonant, path ? `${path}.${idx}` : `${idx}`);
                        ObservableArray._ensureKeysRecursive(wrapped, resonant);
                        const ok = Reflect.set(t, prop, wrapped, receiver);
                        notifyModified(t[idx], idx, oldValue);
                        return ok;
                    }

                    return Reflect.set(t, prop, value, receiver);
                },

                deleteProperty(t, prop) {
                    if (isNumericProp(prop) && Object.prototype.hasOwnProperty.call(t, prop)) {
                        const idx = Number(prop);
                        const old = t[idx];
                        const ok = Reflect.deleteProperty(t, prop);
                        notifyRemoved(old, idx);
                        return ok;
                    }
                    return Reflect.deleteProperty(t, prop);
                }
            };

            return new Proxy(target, handler);
        }
    }

    class Resonant {
        constructor(options = {}) {
            this.config = {
                bindToWindow: options.bindToWindow !== false,
                rootElement: options.rootElement || document
            };
            this.data = {};
            this.callbacks = {};
            this.pendingUpdates = new Map();
            this.arrayDataChangeDetection = {};
            this.computedProperties = {};
            this.computedDependencies = {};
            this._currentComputed = null;
            this._nextKeyId = 1;
            this._changedArrayIndices = {};
            this.cssSelectorBindings = {};
            this._formatters = {};
            this._streams = {};
            this._templates = {};
            this._handlers = {};
            this._transforms = {};
        }

        _splitPath(path) {
            if (typeof path !== 'string') return [];
            return path.split('.').filter(Boolean);
        }
        _getRootAndPath(variableName) {
            const parts = this._splitPath(variableName);
            const root = parts.shift() || variableName;
            return { root, path: parts.join('.') };
        }
        _getByPath(variableName) {
            const { root, path } = this._getRootAndPath(variableName);
            let cur = this.data[root];
            if (!path) return cur;
            const parts = this._splitPath(path);
            for (const p of parts) {
                if (!isObject(cur)) return undefined;
                cur = cur[p];
            }
            return cur;
        }
        _setByPath(variableName, value) {
            const { root, path } = this._getRootAndPath(variableName);
            if (!path) {
                const target = this.config.bindToWindow ? window : this;
                target[root] = value;
                return;
            }
            let cur = this.data[root];
            const parts = this._splitPath(path);
            for (let i = 0; i < parts.length - 1; i++) {
                const p = parts[i];
                if (!isObject(cur[p])) {
                    cur[p] = {};
                }
                cur = cur[p];
            }
            cur[parts[parts.length - 1]] = value;
        }

        _handleInputElement(element, value, onChangeCallback) {
            const tag = element.tagName;
            const type = (element.type || '').toLowerCase();
            if (type === 'checkbox') {
                const b = !!value;
                if (element.checked !== b) element.checked = b;
                if (!element.hasAttribute('data-resonant-bound')) {
                    element.onchange = () => onChangeCallback(!!element.checked);
                    element.setAttribute('data-resonant-bound', 'true');
                }
            } else if (type === 'radio') {
                element.checked = (element.value === String(value));
                if (!element.hasAttribute('data-resonant-bound')) {
                    element.onchange = () => {
                        if (element.checked) onChangeCallback(element.value);
                    };
                    element.setAttribute('data-resonant-bound', 'true');
                }
            } else if (tag === 'SELECT') {
                const v = value ?? '';
                if (element.value !== String(v)) element.value = v;
                if (!element.hasAttribute('data-resonant-bound')) {
                    element.onchange = () => onChangeCallback(element.value);
                    element.setAttribute('data-resonant-bound', 'true');
                }
            } else if (type === 'number' || type === 'range') {
                const v = value ?? '';
                if (element.value !== String(v)) element.value = v;
                if (!element.hasAttribute('data-resonant-bound')) {
                    element.oninput = () => {
                        const raw = element.value;
                        const num = raw === '' ? null : Number(raw);
                        onChangeCallback(Number.isNaN(num) ? null : num);
                    };
                    element.setAttribute('data-resonant-bound', 'true');
                }
            } else {
                const v = value ?? '';
                if (element.value !== String(v)) element.value = v;
                if (!element.hasAttribute('data-resonant-bound')) {
                    element.oninput = () => onChangeCallback(element.value);
                    element.setAttribute('data-resonant-bound', 'true');
                }
            }
        }

        persist(variableName, value, persist) {
            if (!persist) return value;
            try {
                const found = localStorage.getItem('res_' + variableName);
                if (found !== null && found !== undefined) {
                    return JSON.parse(found);
                } else {
                    localStorage.setItem('res_' + variableName, JSON.stringify(value));
                    return value;
                }
            } catch (e) {
                console.warn('Resonant: persistence error for', variableName, e);
                return value;
            }
        }

        updatePersistantData(variableName) {
            try {
                if (localStorage.getItem('res_' + variableName)) {
                    localStorage.setItem('res_' + variableName, JSON.stringify(this.data[variableName]));
                }
            } catch (e) {
                console.warn('Resonant: persistence update error for', variableName, e);
            }
        }

        add(variableName, value, persist) {
            if (arguments.length === 1 || (arguments.length === 2 && typeof value === 'boolean' && variableName in window)) {
                if (arguments.length === 2 && typeof value === 'boolean') {
                    persist = value;
                }
                if (variableName in window) {
                    value = structuredClone(window[variableName]);
                    if (this.config.bindToWindow) delete window[variableName];
                } else {
                    console.warn(`Resonant: "${variableName}" not found on window.`);
                    return;
                }
            }

            value = this.persist(variableName, value, persist);

            if (value != null && value.constructor.name === 'Response') {
                value.json().then(resolvedValue => {
                    this.add(variableName, resolvedValue, persist);
                }).catch(err => {
                    console.error(`Resonant: Error resolving fetch response for variable "${variableName}":`, err);
                });
                return;
            }

            if (value instanceof Promise) {
                value.then(resolvedValue => {
                    this.add(variableName, resolvedValue, persist);
                }).catch(err => {
                    console.error(`Resonant: Error resolving promise for variable "${variableName}":`, err);
                });
                return;
            }

            if (Array.isArray(value)) {
                this.data[variableName] = new ObservableArray(variableName, this, ...value);
                this.arrayDataChangeDetection[variableName] = Array.prototype.slice.call(this.data[variableName]);
            } else if (isObject(value)) {
                this.data[variableName] = this._createObject(variableName, value, '');
            } else {
                this.data[variableName] = value;
            }

            this._defineProperty(variableName);
            this.updateElement(variableName);
            this._processIncludes();
        }

        addAll(config) {
            Object.entries(config).forEach(([variableName, value]) => {
                this.add(variableName, value, false);
            });
        }

        computed(computedName, computeFunction) {
            this.computedProperties[computedName] = computeFunction;
            this.computedDependencies[computedName] = new Set();

            this.computedDependencies[computedName].clear();
            this._currentComputed = computedName;
            try {
                const result = computeFunction();
                this.data[computedName] = result;
                this._defineProperty(computedName);
                this.updateElement(computedName);
            } finally {
                this._currentComputed = null;
            }
        }

        _captureAccess(token) {
            if (this._currentComputed) {
                this.computedDependencies[this._currentComputed].add(token);
            }
        }

        _recomputeProperty(computedName) {
            if (!this.computedProperties[computedName]) return;
            const computeFunction = this.computedProperties[computedName];
            const oldValue = this.data[computedName];
            this.computedDependencies[computedName].clear();
            this._currentComputed = computedName;
            try {
                const newValue = computeFunction();
                if (oldValue !== newValue) {
                    this.data[computedName] = newValue;
                    this.updateElement(computedName);
                    this._queueUpdate(computedName, 'modified', newValue, null, oldValue);
                }
            } finally {
                this._currentComputed = null;
            }
        }

        _resolveValue(instance, key, override = null) {
            return override ?? instance[key];
        }

        _createObject(rootVarName, obj, basePath = '') {
            const self = this;

            const wrap = (o, path) => {
                if (!isObject(o)) return o;
                if (o[PROXY_FLAG]) return o;

                if (Array.isArray(o)) {
                    return ObservableArray._createArrayProxy(o.slice(), rootVarName, self, path);
                }

                ObservableArray._ensureKeysRecursive(o, self);

                const handler = {
                    get(target, property, receiver) {
                        if (property === PROXY_FLAG) return true;
                        if (property === 'bindByCssSelector') {
                            return (cssSelector) => self.bindByCssSelector(rootVarName, cssSelector);
                        }
                        if (self._currentComputed && typeof property !== 'symbol') {
                            const token = path ? `${rootVarName}.${path}.${String(property)}` : `${rootVarName}.${String(property)}`;
                            self._captureAccess(rootVarName);
                            self._captureAccess(token);
                        }
                        const value = Reflect.get(target, property, receiver);
                        if (isObject(value)) {
                            const childPath = path ? `${path}.${String(property)}` : String(property);
                            let wrapped;
                            if (value[PROXY_FLAG]) {
                                return value;
                            }
                            if (Array.isArray(value)) {
                                wrapped = ObservableArray._createArrayProxy(value, rootVarName, self, childPath);
                            } else {
                                wrapped = wrap(value, childPath);
                            }

                            target[property] = wrapped;
                            return wrapped;
                        }
                        return value;
                    },
                    set(target, property, value, receiver) {
                        const oldValue = target[property];
                        if (oldValue === value) return true;
                        const childPath = path ? `${path}.${String(property)}` : String(property);
                        const wrapped = wrap(value, childPath);
                        ObservableArray._ensureKeysRecursive(wrapped, self);
                        const ok = Reflect.set(target, property, wrapped, receiver);
                        self._queueUpdate(rootVarName, 'modified', target, String(property), oldValue, null, childPath);
                        return ok;
                    },
                    deleteProperty(target, property) {
                        const oldValue = target[property];
                        const ok = Reflect.deleteProperty(target, property);
                        if (ok) {
                            self._queueUpdate(rootVarName, 'removed', null, String(property), oldValue, null, path ? `${path}.${String(property)}` : String(property));
                        }
                        return ok;
                    }
                };

                try {
                    Object.defineProperty(o, PROXY_FLAG, { value: true, enumerable: false });
                } catch (_) {}
                return new Proxy(o, handler);
            };

            return wrap(obj, basePath);
        }

        _evaluateDisplayCondition(element, instance, condition, variableName) {
            try {
                let expr = condition || '';
                let show = false;

                if (variableName) {
                    const { root } = this._getRootAndPath(variableName);
                    if (instance && isObject(instance)) {
                        const rootPattern = new RegExp(`\\b${root}\\b`, 'g');
                        expr = expr.replace(rootPattern, 'item');

                        const tokens = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
                        tokens.forEach(tok => {
                            if (tok === 'item' || tok === 'true' || tok === 'false' || tok === 'null' || tok === 'undefined') return;
                            if (Object.prototype.hasOwnProperty.call(instance, tok)) {
                                const rx = new RegExp(`\\b${tok}\\b`, 'g');
                                expr = expr.replace(rx, `item.${tok}`);
                            }
                        });
                    }
                }

                try {
                    show = !!(new Function('item', 'state', `return (${expr});`))(instance, this.data);
                } catch (e) {
                    show = !!(new Function(`return (${condition});`))();
                }

                element.style.display = show ? 'inherit' : 'none';
            } catch (e) {
                console.error(`Error evaluating display condition: ${condition}`, e);
            }
        }

        _handleDisplayElements(parentElement, instance, variableName) {
            const displayElements = parentElement.querySelectorAll('[res-display]');
            displayElements.forEach(displayEl => {
                const condition = displayEl.getAttribute('res-display') || '';
                this._evaluateDisplayCondition(displayEl, instance, condition, variableName);
            });
        }

        _evaluateStyleCondition(styleElement, instance, condition, variableName) {
            try {
                const prev = styleElement.getAttribute('res-styles');
                if (prev) {
                    prev.split(/\s+/).filter(Boolean).forEach(cls => styleElement.classList.remove(cls));
                    styleElement.removeAttribute('res-styles');
                }
                let styleClass = '';
                try {
                    const keys = (instance && isObject(instance))
                        ? Object.keys(instance).filter(k => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k))
                        : [];
                    const fn = new Function(...keys, 'item', 'state', `return (${condition});`);
                    styleClass = fn(...keys.map(k => instance[k]), instance, this.data);
                } catch (e) {
                    styleClass = (new Function(`return (${condition});`))();
                }
                if (typeof styleClass === 'string' && styleClass.trim()) {
                    styleClass.split(/\s+/).forEach(cls => styleElement.classList.add(cls));
                    styleElement.setAttribute('res-styles', styleClass.trim());
                }
            } catch (e) {
                console.error(`Error evaluating style for ${variableName}: ${condition}`, e);
            }
        }

        _handleStyleElements(parentElement, instance, variableName) {
            const styleElements = parentElement.querySelectorAll('[res-style]');
            styleElements.forEach(styleEl => {
                this._evaluateStyleCondition(styleEl, instance, styleEl.getAttribute('res-style') || '', variableName);
            });
        }

        _bindEvents(parentElement, instance, arrayValue, overrides) {
            _RES_EVENTS.forEach(ev => {
                const attr = 'res-on' + ev;
                parentElement.querySelectorAll('[' + attr + ']').forEach(elx => {
                    const name = elx.getAttribute(attr);
                    elx['on' + ev] = (event) => {
                        const fn = this._resolveHandler(name, overrides);
                        if (typeof fn === 'function') {
                            try { fn(instance, event); }
                            catch (e) { console.error('Resonant: ' + ev + ' handler error for', name, e); }
                        } else {
                            console.warn('Resonant: ' + ev + ' handler not found:', name);
                        }
                    };
                });
            });
            parentElement.querySelectorAll('[res-onclick-remove]').forEach(elx => {
                const removeKey = elx.getAttribute('res-onclick-remove');
                elx.onclick = () => {
                    if (Array.isArray(arrayValue)) {
                        const i = arrayValue.findIndex(t => isObject(t) && t[removeKey] === instance[removeKey]);
                        if (i !== -1) arrayValue.splice(i, 1);
                    }
                };
            });
        }

        bindEvents(rootEl, instance) {
            this._bindEvents(rootEl || this.config.rootElement, instance ?? null, null, null);
            return this;
        }

        _defineProperty(variableName) {
            const target = this.config.bindToWindow ? window : this;
            Object.defineProperty(target, variableName, {
                configurable: true,
                get: () => {
                    this._captureAccess(variableName);
                    return this.data[variableName];
                },
                set: (newValue) => {
                    if (this.computedProperties[variableName]) {
                        console.warn(`Cannot set computed property "${variableName}"`);
                        return;
                    }

                    if (Array.isArray(newValue)) {
                        this.data[variableName] = new ObservableArray(variableName, this, ...newValue);
                        this.arrayDataChangeDetection[variableName] = Array.prototype.slice.call(this.data[variableName]);
                    } else if (isObject(newValue)) {
                        this.data[variableName] = this._createObject(variableName, newValue, '');
                    } else {
                        this.data[variableName] = newValue;
                    }
                    this.updateElement(variableName);
                    this.updateDisplayConditionalsFor(variableName);
                    this.updateStylesFor(variableName);
                    this._updateCssSelectorBindings(variableName);

                    if (!Array.isArray(newValue) && !isObject(newValue)) {
                        this._queueUpdate(variableName, 'modified', this.data[variableName]);
                    }
                }
            });
        }

        _queueUpdate(variableName, action, item, property = null, oldValue = undefined, index = null, path = null) {
            if (!this.pendingUpdates.has(variableName)) {
                this.pendingUpdates.set(variableName, []);
            }
            this.pendingUpdates.get(variableName).push({ action, item, property, oldValue, index, path });

            if (!this._changedArrayIndices[variableName]) {
                this._changedArrayIndices[variableName] = new Set();
            }
            if (typeof index === 'number' && index >= 0) {
                this._changedArrayIndices[variableName].add(index);
            } else if (typeof path === 'string') {
                const m = path.match(/^(\d+)(\.|$)/);
                if (m) {
                    this._changedArrayIndices[variableName].add(Number(m[1]));
                }
            }

            if (this.pendingUpdates.get(variableName).length === 1) {
                setTimeout(() => {
                    let updates = this.pendingUpdates.get(variableName) || [];
                    this.updatePersistantData(variableName);
                    this.pendingUpdates.delete(variableName);

                    const seen = new Map();
                    const keyOf = (u) => `${u.action}|${u.property ?? ''}|${u.index ?? ''}|${u.path ?? ''}`;
                    updates.forEach(u => seen.set(keyOf(u), u));
                    updates = Array.from(seen.values());

                    updates.forEach(u => {
                        this._triggerCallbacks(variableName, u);
                    });

                    const changedTokens = new Set();
                    updates.forEach(u => {
                        changedTokens.add(variableName);
                        if (u.path) changedTokens.add(`${variableName}.${u.path}`);
                    });
                    let recomputedAny = true;
                    while (recomputedAny) {
                        recomputedAny = false;
                        Object.keys(this.computedDependencies).forEach(computedName => {
                            const deps = this.computedDependencies[computedName];
                            for (const tok of changedTokens) {
                                if (deps.has(tok) || deps.has(variableName)) {
                                    const oldVal = this.data[computedName];
                                    this._recomputeProperty(computedName);
                                    if (this.data[computedName] !== oldVal) {
                                        changedTokens.add(computedName);
                                        recomputedAny = true;
                                    }
                                    break;
                                }
                            }
                        });
                    }

                    this.updateElement(variableName);
                    this.updateDisplayConditionalsFor(variableName);
                    this.updateStylesFor(variableName);
                    this._updateCssSelectorBindings(variableName);

                    if (this._changedArrayIndices[variableName]) {
                        delete this._changedArrayIndices[variableName];
                    }
                }, 0);
            }
        }

        _triggerCallbacks(variableName, callbackData) {
            if (this.callbacks[variableName]) {
                this.callbacks[variableName].forEach(callback => {
                    const item = callbackData.item || callbackData.oldValue;
                    try {
                        const t = this.config.bindToWindow ? window : this;
                        const currentValue = (typeof t !== 'undefined' && t[variableName] !== undefined)
                            ? t[variableName]
                            : this.data[variableName];
                        callback(currentValue, item, callbackData.action);
                    } catch (e) {
                        console.error('Resonant: callback error for', variableName, e);
                    }
                });
            }
        }

        updateElement(variableName) {
            const { root } = this._getRootAndPath(variableName);
            const elements = this.config.rootElement.querySelectorAll(`[res="${root}"], [res^="${root}."]`);
            elements.forEach(element => {
                const resAttr = element.getAttribute('res');
                const boundValue = this._getByPath(resAttr);

                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    this._handleInputElement(element, boundValue, (newValue) => {
                        this._setByPath(resAttr, newValue);
                        const { root: root2, path } = this._getRootAndPath(resAttr);
                        this._queueUpdate(root2, 'modified', this._getByPath(resAttr), path ? path.split('.').pop() : null, null, null, path || null);
                    });
                }
                else if (Array.isArray(boundValue)) {
                    if (element.getAttribute('res-rendered') === 'true') return;
                    this._renderArray(resAttr, element);
                }
                else if (isObject(boundValue)) {
                    const subElements = element.querySelectorAll('[res-prop]');
                    subElements.forEach(subEl => {
                        const key = subEl.getAttribute('res-prop');
                        if (key && key in boundValue) {
                            this._renderObjectProperty(subEl, boundValue[key], resAttr, key);
                        }
                    });
                }
                else {
                    this._writeValue(element, boundValue, resAttr);
                }
            });

            this.updateDisplayConditionalsFor(variableName);
            this.updateStylesFor(variableName);
            this._updateCssSelectorBindings(variableName);
        }

        _renderObjectProperty(subEl, propValue, parentVarName, key) {
            const tag = subEl.tagName;
            if ((tag === 'INPUT' || tag === 'TEXTAREA') &&
                !Array.isArray(propValue) &&
                !isObject(propValue)) {
                const path = `${parentVarName}.${key}`;
                this._handleInputElement(subEl, propValue, (newValue) => {
                    this._setByPath(path, newValue);
                });
            }
            else if (Array.isArray(propValue)) {
                let parentKey = null;
                const parentObj = this._getByPath(parentVarName);
                if (parentObj && isObject(parentObj)) {
                    try { parentKey = parentObj.key; } catch (_) {}
                } else {
                    const childAttr = subEl.getAttribute('res-child');
                    if (childAttr && childAttr.includes('--')) {
                        parentKey = childAttr.split('--')[1];
                    }
                }
                this._renderNestedArray(subEl, propValue, parentKey, parentVarName);
            }
            else if (isObject(propValue)) {
                const nestedElements = subEl.querySelectorAll('[res-prop]');
                nestedElements.forEach(nestedEl => {
                    const nestedKey = nestedEl.getAttribute('res-prop');
                    if (nestedKey && nestedKey in propValue) {
                        this._renderObjectProperty(nestedEl, propValue[nestedKey], parentVarName, nestedKey);
                    }
                });
            }
            else {
                this._writeValue(subEl, propValue, null, this._getByPath(parentVarName));
            }
        }

        _renderArray(variablePath, el) {
            const arrayValue = this._getByPath(variablePath);
            const container = el.hasAttribute('res') && el.parentElement ? el.parentElement : el;

            const overrides = {};
            for (const [aName, aVal] of this._attrEntries(el)) {
                if (aName.slice(0, 7) === 'res-on:') overrides[aName.slice(7)] = aVal;
            }

            let template;
            const tplKey = variablePath + "_template";
            if (!window[tplKey]) {
                const useName = el.getAttribute('res-use');
                template = (useName && this._templates[useName])
                    ? this._templates[useName].cloneNode(true)
                    : el.cloneNode(true);
                window[tplKey] = template;
                el.style.display = 'none';
                el.setAttribute('res-template', 'true');
            } else {
                template = window[tplKey];
            }

            const existingElements = new Map();
            const existingElementsList = Array.from(container.querySelectorAll(`[res="${variablePath}"][res-rendered="true"]`));
            existingElementsList.forEach(element => {
                const key = element.getAttribute('res-key');
                if (key) existingElements.set(key, element);
            });

            const changedSet = this._changedArrayIndices[variablePath] || this._changedArrayIndices[this._getRootAndPath(variablePath).root];
            const usedElements = new Set();

            arrayValue.forEach((instance, index) => {
                let elementKey = null;
                try { elementKey = instance && instance.key; } catch (_) {}
                if (!elementKey) elementKey = String(index);

                let elementToUse;
                let shouldReuse = existingElements.has(elementKey) && !(changedSet && changedSet.has(index));
                if (shouldReuse) {
                    elementToUse = existingElements.get(elementKey);
                    usedElements.add(elementToUse);
                    elementToUse.setAttribute("res-index", index);
                } else {
                    elementToUse = template.cloneNode(true);
                    elementToUse.removeAttribute('res-template');
                    elementToUse.style.display = '';
                    elementToUse.setAttribute("res-rendered", "true");
                    elementToUse.setAttribute("res-key", elementKey);
                    elementToUse.setAttribute("res", variablePath);
                }
                elementToUse.setAttribute("res-index", index);

                if (!shouldReuse) {
                    if (!isObject(instance)) {
                        const anyPlace = elementToUse.querySelector('[res-prop=""]');
                        this._writeValue(anyPlace || elementToUse, String(instance), null, instance);
                    } else {
                        const keys = Object.keys(instance);
                        keys.forEach(key => {
                            let overrideInstanceValue = null;
                            let subEl = elementToUse.querySelector(`[res-prop="${key}"]`);
                            if (!subEl) {
                                subEl = elementToUse.querySelector('[res-prop=""]');
                                overrideInstanceValue = instance;
                            }
                            if (subEl) {
                                const value = this._resolveValue(instance, key, overrideInstanceValue);
                                const tag = subEl.tagName;
                                if ((tag === 'INPUT' || tag === 'TEXTAREA') &&
                                    !Array.isArray(value) &&
                                    !isObject(value)) {
                                    const prev = value;
                                    this._handleInputElement(
                                        subEl,
                                        value,
                                        (newValue) => {
                                            instance[key] = newValue;
                                            this._queueUpdate(this._getRootAndPath(variablePath).root, 'modified', instance, key, prev, index, `${index}.${key}`);
                                        }
                                    );
                                }
                                else if (!Array.isArray(value) && !isObject(value)) {
                                    this._writeValue(subEl, value, null, instance);
                                }
                            }
                        });
                    }
                }

                if (isObject(instance)) {
                    const keys = Object.keys(instance);
                    keys.forEach(key => {
                        let subEl = elementToUse.querySelector(`[res-prop="${key}"]`);
                        if (subEl) {
                            const value = this._resolveValue(instance, key, null);
                            if (Array.isArray(value)) {
                                let parentKey = null;
                                try { parentKey = arrayValue[index]?.key; } catch (_) {}
                                this._renderNestedArray(subEl, value, parentKey, variablePath);
                            }
                            else if (isObject(value)) {
                                const nestedElements = subEl.querySelectorAll('[res-prop]');
                                nestedElements.forEach(nestedEl => {
                                    const nestedKey = nestedEl.getAttribute('res-prop');
                                    if (nestedKey && nestedKey in value) {
                                        this._renderObjectProperty(nestedEl, value[nestedKey], variablePath, `${index}.${nestedKey}`);
                                    }
                                });
                            }
                        }
                    });
                }

                if (!shouldReuse) {
                    this._handleDisplayElements(elementToUse, instance, variablePath);
                    this._handleStyleElements(elementToUse, instance, variablePath);
                    this._bindEvents(elementToUse, instance, arrayValue, overrides);
                }

                container.appendChild(elementToUse);
            });

            existingElementsList.forEach(element => {
                if (!usedElements.has(element)) {
                    element.remove();
                }
            });

            const emptyName = el.getAttribute('res-empty');
            if (emptyName) {
                const existingEmpty = container.querySelector(`[res-empty-for="${variablePath}"]`);
                if (arrayValue.length === 0) {
                    if (!existingEmpty && this._templates[emptyName]) {
                        const node = this._templates[emptyName].cloneNode(true);
                        node.setAttribute('res-empty-for', variablePath);
                        container.appendChild(node);
                    }
                } else if (existingEmpty) {
                    existingEmpty.remove();
                }
            }
        }

        _renderNestedArray(subEl, arrayValue, parentKey, parentVarPath) {
            if (!subEl.__res_template) {
                subEl.__res_template = subEl.cloneNode(true);
            }

            const template = subEl.__res_template;
            subEl.innerHTML = '';
            while (subEl.children && subEl.children.length) {
                subEl.children[0].remove();
            }

            arrayValue.forEach((item, idx) => {
                const cloned = template.cloneNode(true);
                cloned.setAttribute('res-rendered', 'true');
                cloned.setAttribute('res-index', idx);

                if (item !== null && !isObject(item)) {
                    this._writeValue(cloned, item, null, item);
                } else {
                    const nestedEls = cloned.querySelectorAll('[res-prop]');
                    nestedEls.forEach(nestedEl => {
                        const nestedKey = nestedEl.getAttribute('res-prop');
                        if (nestedKey && nestedKey in item) {
                            let itemKey = null;
                            try { itemKey = item.key; } catch (_) {}
                            nestedEl.setAttribute('res-child', (itemKey ? `${itemKey}-` : '') + nestedKey + '--' + (parentKey || ''));
                            this._renderObjectProperty(nestedEl, item[nestedKey], parentVarPath, nestedKey);
                        }
                    });

                    const displayCondition = cloned.getAttribute('res-display');
                    if (displayCondition) {
                        this._evaluateDisplayCondition(cloned, item, displayCondition, parentVarPath);
                    }
                    this._handleDisplayElements(cloned, item, parentVarPath);
                    this._bindEvents(cloned, item, arrayValue);
                }
                subEl.appendChild(cloned);
            });
        }

        updateDisplayConditionalsFor(variableName) {
            const conditionalElements = this.config.rootElement.querySelectorAll(`[res-display*="${variableName}"]`);
            conditionalElements.forEach(conditionalElement => {
                const condition = conditionalElement.getAttribute('res-display');

                let instance = null;
                let node = conditionalElement;
                while (node) {
                    const r = node.getAttribute && node.getAttribute('res');
                    const idx = node.getAttribute && node.getAttribute('res-index');
                    if (r) {
                        const bound = this._getByPath(r);
                        if (Array.isArray(bound) && idx !== null && idx !== undefined) {
                            instance = bound[Number(idx)];
                            break;
                        } else {
                            instance = bound;
                            break;
                        }
                    }
                    node = node.parentElement;
                }
                this._evaluateDisplayCondition(conditionalElement, instance ?? this.data[variableName], condition, variableName);
            });

            const bound = this.data[variableName];
            if (Array.isArray(bound)) {
                const changedIndices = this._changedArrayIndices[variableName];
                const renderedItems = this.config.rootElement.querySelectorAll(`[res="${variableName}"][res-rendered="true"]`);
                renderedItems.forEach(renderedItem => {
                    const idx = renderedItem.getAttribute('res-index');
                    if (changedIndices && idx !== null && idx !== undefined && !changedIndices.has(Number(idx))) return;
                    const displayEls = renderedItem.querySelectorAll('[res-display]');
                    displayEls.forEach(conditionalElement => {
                        const condition = conditionalElement.getAttribute('res-display');
                        const instance = idx !== null && idx !== undefined ? bound[Number(idx)] : bound;
                        this._evaluateDisplayCondition(conditionalElement, instance, condition, variableName);
                    });
                });
            } else {
                const contextElements = this.config.rootElement.querySelectorAll(`[res="${variableName}"] [res-display]`);
                contextElements.forEach(conditionalElement => {
                    const condition = conditionalElement.getAttribute('res-display');
                    this._evaluateDisplayCondition(conditionalElement, bound, condition, variableName);
                });
            }
        }

        updateStylesFor(variableName) {
            const styleElements = this.config.rootElement.querySelectorAll(`[res-style*="${variableName}"]`);
            styleElements.forEach(styleElement => {
                let styleCondition = styleElement.getAttribute('res-style');
                try {
                    const prev = styleElement.getAttribute('res-styles');
                    if (prev) {
                        prev.split(/\s+/).filter(Boolean).forEach(cls => styleElement.classList.remove(cls));
                        styleElement.removeAttribute('res-styles');
                    }


                    let parent = styleElement;
                    let boundPath = null;
                    let index = null;
                    while (parent) {
                        const r = parent.getAttribute && parent.getAttribute('res');
                        if (r) {
                            boundPath = r;
                            const i = parent.getAttribute('res-index');
                            if (i !== null && i !== undefined) index = i;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    let ctxItem = null;
                    if (boundPath) {
                        const bound = this._getByPath(boundPath);
                        if (Array.isArray(bound) && index !== null) {
                            ctxItem = bound[Number(index)];
                        } else {
                            ctxItem = bound;
                        }
                    }

                    let expr = styleCondition;
                    if (boundPath) {
                        const { root } = this._getRootAndPath(boundPath);
                        const rootPattern = new RegExp(`\\b${root}\\b`, 'g');
                        expr = expr.replace(rootPattern, 'item');
                    }

                    const styleClass = (new Function('item', 'state', `return (${expr});`))(ctxItem, this.data);

                    if (typeof styleClass === 'string' && styleClass.trim()) {
                        styleClass.split(/\s+/).forEach(cls => styleElement.classList.add(cls));
                        styleElement.setAttribute('res-styles', styleClass.trim());
                    }
                } catch (e) {
                    console.error(`Error evaluating style for ${variableName}: ${styleCondition}`, e);
                }
            });
        }

        addCallback(variableName, method) {
            if (!this.callbacks[variableName]) {
                this.callbacks[variableName] = [];
            }
            this.callbacks[variableName].push(method);
        }

        registerTemplate(name, source) {
            let root;
            if (source && typeof source === 'object' && (source.tagName || source.nodeType)) {
                root = source;
            } else {
                const holder = document.createElement('div');
                holder.innerHTML = String(source).trim();
                root = holder.firstElementChild || (holder.children && holder.children[0]) || null;
            }
            if (!root) { console.warn('Resonant: registerTemplate("' + name + '") has no root element'); return this; }
            this._templates[name] = root;
            return this;
        }

        _attrEntries(el) {
            const at = el && el.attributes;
            if (!at) return [];
            if (typeof at.length === 'number') return Array.from(at).map(a => [a.name, a.value]);
            return Object.keys(at).map(k => [k, at[k]]);
        }

        handler(name, fn) {
            if (typeof fn === 'function') this._handlers[name] = fn;
            return this;
        }

        transform(name, fn) {
            if (typeof fn === 'function') this._transforms[name] = fn;
            return this;
        }
        _resolveFormat(name) {
            if (typeof this._transforms[name] === 'function') return this._transforms[name];
            return (typeof window[name] === 'function') ? window[name] : null;
        }

        _writeValue(el, value, variableName, item, meta) {
            const fmtName = el.getAttribute && el.getAttribute('res-format');
            const fmt = fmtName ? this._resolveFormat(fmtName) : null;
            if (fmt) { el.innerHTML = String(fmt(value, item) ?? ''); return; }
            const named = variableName ? this._formatters[variableName] : null;
            if (named) { el.innerHTML = named(value ?? '', meta || { done: true }); return; }
            if (el.hasAttribute('res-html')) el.innerHTML = value ?? '';
            else el.textContent = value ?? '';
        }

        _resolveHandler(attrValue, overrides) {
            if (attrValue.slice(0, 4) === 'res.') {
                const key = attrValue.slice(4);
                if (overrides && overrides[key] && typeof window[overrides[key]] === 'function') return window[overrides[key]];
                if (typeof this._handlers[key] === 'function') return this._handlers[key];
                return null;
            }
            return (typeof window[attrValue] === 'function') ? window[attrValue] : null;
        }

        processIncludes(rootEl) { this._processIncludes(rootEl); return this; }
        _processIncludes(rootEl) {
            const host = rootEl || this.config.rootElement;
            if (!host || !host.querySelectorAll) return;
            Array.from(host.querySelectorAll('[res-include]')).forEach((el) => {
                const name = el.getAttribute('res-include');
                const tpl = this._templates[name];
                if (!tpl) { console.warn('Resonant: res-include template not found:', name); return; }
                const node = tpl.cloneNode(true);
                const overrides = {};
                for (const [aName, aVal] of this._attrEntries(el)) {
                    if (aName.slice(0, 7) === 'res-on:') overrides[aName.slice(7)] = aVal;
                }
                let instance = null, ctxPath = null;
                const ctxEl = el.parentElement && el.parentElement.closest('[res]');
                if (ctxEl) { ctxPath = ctxEl.getAttribute('res'); try { instance = this._getByPath(ctxPath); } catch (_) {} }
                el.replaceWith(node);
                this._handleDisplayElements(node, instance, ctxPath);
                this._bindEvents(node, instance, null, overrides);
                if (instance && isObject(instance)) {
                    node.querySelectorAll('[res-prop]').forEach((subEl) => {
                        const key = subEl.getAttribute('res-prop');
                        if (key && key in instance) this._renderObjectProperty(subEl, instance[key], ctxPath, key);
                    });
                }
            });
        }

        format(variableName, fn) {
            if (typeof fn !== 'function') {
                console.warn('Resonant: format() expects a function for', variableName);
                return this;
            }
            this._formatters[variableName] = fn;
            this.updateElement(variableName);
            return this;
        }

        stream(variableName, opts = {}) {
            if (variableName.indexOf('.') !== -1) {
                console.warn('Resonant: stream() targets a top-level scalar; got', variableName);
            }
            const throttle = Number(opts.throttle) || 0;
            const preserveSelection = opts.preserveSelection !== false;
            const st = this._streams[variableName] = {
                raw: String(this.data[variableName] ?? ''),
                throttle, preserveSelection, timer: null,
            };
            const schedule = () => {
                if (st.timer) return;
                st.timer = setTimeout(() => { st.timer = null; this._flushStream(variableName); }, throttle);
            };
            const commit = (raw) => { st.raw = raw; this.data[variableName] = raw; };
            return {
                write: (chunk) => { commit(st.raw + String(chunk ?? '')); schedule(); return this; },
                rewind: (n) => { commit(st.raw.slice(0, -Math.max(0, n | 0) || st.raw.length)); schedule(); return this; },
                end: () => { this._endStream(variableName, true); return this; },
                fail: (err) => { this._endStream(variableName, false, err); return this; },
            };
        }

        _flushStream(variableName, final = false) {
            const st = this._streams[variableName];
            const raw = (st ? st.raw : this.data[variableName]) ?? '';
            const elements = this.config.rootElement.querySelectorAll(`[res="${variableName}"]`);
            if (!final && st && st.preserveSelection && typeof window !== 'undefined' && window.getSelection) {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed && sel.anchorNode) {
                    for (const el of elements) {
                        if (el.contains(sel.anchorNode)) {
                            if (!st.timer) st.timer = setTimeout(() => { st.timer = null; this._flushStream(variableName); }, st.throttle || 16);
                            return;
                        }
                    }
                }
            }
            elements.forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.value = raw; return; }
                this._writeValue(el, raw, variableName, null, { done: final });
            });
        }

        _endStream(variableName, ok, err) {
            const st = this._streams[variableName];
            if (st && st.timer) { clearTimeout(st.timer); st.timer = null; }
            if (st) this.data[variableName] = st.raw;
            this._flushStream(variableName, true);
            delete this._streams[variableName];
            if (err) console.error('Resonant: stream failed for', variableName, err);
            this._queueUpdate(variableName, ok ? 'modified' : 'error', this.data[variableName]);
        }

        bindByCssSelector(variableName, cssSelector) {
            if (!this.cssSelectorBindings[variableName]) {
                this.cssSelectorBindings[variableName] = new Set();
            }
            this.cssSelectorBindings[variableName].add(cssSelector);
            this._updateCssSelectorBindings(variableName);
        }

        _updateCssSelectorBindings(variableName) {
            const selectors = this.cssSelectorBindings[variableName];
            if (!selectors || selectors.size === 0) return;
            const value = this.data[variableName];
            const displayValue = (value === null || value === undefined)
                ? ''
                : (isObject(value) || Array.isArray(value))
                    ? JSON.stringify(value)
                    : String(value);
            selectors.forEach(selector => {
                try {
                    const elements = this.config.rootElement.querySelectorAll(selector);
                    elements.forEach(el => {
                        const tag = el.tagName;
                        if (tag === 'INPUT' || tag === 'TEXTAREA') {
                            el.value = displayValue;
                        } else {
                            this._writeValue(el, displayValue, null);
                        }
                    });
                } catch (_) {}
            });
        }
    }

    window.Resonant = Resonant;
    window.ObservableArray = ObservableArray;
})();