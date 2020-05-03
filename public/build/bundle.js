
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const sizes = {
        'long': {
            name: 'Лонг-дринк',
            value: 'long',
        }, 
        'short': {
            name: 'Шот',
            value: 'short',
        }, 
        'decanter': {
            name: 'Графин',
            value: 'decanter',
        }
    };

    const ingridients = {
        whiskey: 'Виски',
        vodka: 'Водка',
        white_rum: 'Белый Ром',
        black_rum: 'Темный Ром',
        tequila_silver: 'Светлая текила',
        champagne: 'Шампанское',
        gin: 'Джин',

        tripple_seq: 'Аплельсиновый ликер',
        bols_strawbery: 'Клубничный ликер',
        baylis: 'Сливочный ликер',
        blue_curasao: 'Блю курасао',
        coffee_liquer: 'Кофейный ликер',
        peach_liquer: 'персиковый ликер',
        limonchello: 'Лимончелло',
        
        coconut_syroup: 'Кокосовый сироп',

        cola: 'Кола',
        cream: 'Сливки',
        pineapple_juice: 'Ананасовый сок',

        pinapple: 'Анананас',
        cherry: 'Виишня'
    };

    const ingridients_structure = {
        alcohol: {
            name: 'Алкоголь',
            values: [
                'whiskey',
                'vodka',
                'white_rum',
                'black_rum',
                'tequila_silver',
                'champagne',
                'gin',
            ]
        },
        liquers: {
            name: 'Ликеры',
            values: [
                
            ]
        },
        syrups: {
            name: 'Сиропы',
            values: [

            ],
        },
        juicies: {
            name: 'Соки',
            values: [
                
            ]
        },
        soft_drinks: {
            name: 'Безалкогольные напитки',
            values: [

            ],
        },
        fruits: {
            name: 'Фрукты, ягоды',
            values: [

            ],
        },
        other: {
            name: 'Прочее',
            values: [

            ],
        }
    };

    const db = [
        {
            name: 'Виски-кола',
            id: 1,
            value: 'whiskey_cola',
            size: sizes.long,
            composition: [
                {whiskey: '50'},
                {cola: '150'},
            ],
            vol: '200',
            alc: null, //number
            reciept: `1. Наливаем в бокал ингредиенты
        2. Аккуратно перемешиваем`,
            comment: '',
            img: '',
        },
        {
            name: 'Пина-Колада',
            id: 2,
            value: 'pina_colada',
            size: sizes.long,
            composition: [
                {white_rum: '40'},
                {coconut_syroup: '10'},
                {pineapple_juice: '90'},
                {pinapple: '1 долька'},
                {cherry: '1шт'},
            ],
            vol: '170',
            alc: null, //number
            reciept: `1. Насыпать кубики льда в шейкер
        2. Добавить ром, кокосовый сироп, ананасовый сок и сливки
        3. Взбить
        4. Процедить в бокал харрикейн (400мл)
        5. Украсить ананасом, трубочкой и коктейльной вишней`,
            comment: '',
            img: '',
        }
    ];

    /* src/App.svelte generated by Svelte v3.21.0 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (77:2) {#if isOpenSearch === true}
    function create_if_block(ctx) {
    	let div;
    	let input;
    	let t0;
    	let p;
    	let a;
    	let t1;
    	let t2_value = (/*isOpenContains*/ ctx[2] ? "↓" : "→") + "";
    	let t2;
    	let t3;
    	let dispose;
    	let if_block = /*isOpenContains*/ ctx[2] === true && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			p = element("p");
    			a = element("a");
    			t1 = text("Поиск по составу ");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "name", "name");
    			attr_dev(input, "class", "input svelte-gk09je");
    			attr_dev(input, "placeholder", "Поиск по названию");
    			add_location(input, file, 78, 4, 1547);
    			attr_dev(a, "href", "javascript:");
    			add_location(a, file, 79, 7, 1621);
    			add_location(p, file, 79, 4, 1618);
    			attr_dev(div, "class", "filters svelte-gk09je");
    			add_location(div, file, 77, 3, 1521);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, a);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(div, t3);
    			if (if_block) if_block.m(div, null);
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*openContains*/ ctx[6], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isOpenContains*/ 4 && t2_value !== (t2_value = (/*isOpenContains*/ ctx[2] ? "↓" : "→") + "")) set_data_dev(t2, t2_value);

    			if (/*isOpenContains*/ ctx[2] === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(77:2) {#if isOpenSearch === true}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if isOpenContains === true}
    function create_if_block_1(ctx) {
    	let div;
    	let each_value_2 = /*typesArray*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "filters svelte-gk09je");
    			add_location(div, file, 81, 5, 1761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ingridients_structure, typesArray, ingridients, typesFlags, toggleType*/ 25) {
    				each_value_2 = /*typesArray*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if isOpenContains === true}",
    		ctx
    	});

    	return block;
    }

    // (85:7) {#if typesFlags[type.type] === true}
    function create_if_block_2(ctx) {
    	let div;
    	let t;
    	let each_value_3 = ingridients_structure[/*type*/ ctx[13].type].values;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "filters svelte-gk09je");
    			add_location(div, file, 85, 8, 1990);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ingridients_structure, typesArray, ingridients*/ 8) {
    				each_value_3 = ingridients_structure[/*type*/ ctx[13].type].values;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(85:7) {#if typesFlags[type.type] === true}",
    		ctx
    	});

    	return block;
    }

    // (87:9) {#each ingridients_structure[type.type].values as name}
    function create_each_block_3(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let t0;
    	let label;
    	let t1_value = ingridients[/*name*/ ctx[16]] + "";
    	let t1;
    	let label_for_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*name*/ ctx[16]);
    			attr_dev(input, "class", "svelte-gk09je");
    			add_location(input, file, 88, 11, 2121);
    			attr_dev(label, "for", label_for_value = /*name*/ ctx[16]);
    			attr_dev(label, "class", "svelte-gk09je");
    			add_location(label, file, 89, 11, 2169);
    			attr_dev(div, "class", "checkbox svelte-gk09je");
    			add_location(div, file, 87, 10, 2087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(87:9) {#each ingridients_structure[type.type].values as name}",
    		ctx
    	});

    	return block;
    }

    // (83:6) {#each typesArray as type}
    function create_each_block_2(ctx) {
    	let p;
    	let a;
    	let t0_value = /*type*/ ctx[13].name + "";
    	let t0;
    	let t1;
    	let t2_value = (/*typesFlags*/ ctx[0][/*type*/ ctx[13].type] ? "↓" : "→") + "";
    	let t2;
    	let t3;
    	let if_block_anchor;
    	let dispose;
    	let if_block = /*typesFlags*/ ctx[0][/*type*/ ctx[13].type] === true && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			p = element("p");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a, "href", "javascript:");
    			add_location(a, file, 83, 10, 1826);
    			add_location(p, file, 83, 7, 1823);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, p, anchor);
    			append_dev(p, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*toggleType*/ ctx[4](/*type*/ ctx[13].type), false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*typesFlags*/ 1 && t2_value !== (t2_value = (/*typesFlags*/ ctx[0][/*type*/ ctx[13].type] ? "↓" : "→") + "")) set_data_dev(t2, t2_value);

    			if (/*typesFlags*/ ctx[0][/*type*/ ctx[13].type] === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(83:6) {#each typesArray as type}",
    		ctx
    	});

    	return block;
    }

    // (108:6) {#each cocktail.composition as c, j}
    function create_each_block_1(ctx) {
    	let span;
    	let t0_value = ingridients[Object.keys(/*c*/ ctx[10])[0]] + "";
    	let t0;

    	let t1_value = (/*j*/ ctx[12] !== /*cocktail*/ ctx[7].composition.length - 1
    	? ", "
    	: "") + "";

    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(t1_value);
    			add_location(span, file, 108, 7, 2593);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(108:6) {#each cocktail.composition as c, j}",
    		ctx
    	});

    	return block;
    }

    // (102:2) {#each db as cocktail, i}
    function create_each_block(ctx) {
    	let div2;
    	let div0;
    	let p0;
    	let b0;
    	let t0_value = /*cocktail*/ ctx[7].name + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let b1;
    	let t3_value = /*cocktail*/ ctx[7].id + "";
    	let t3;
    	let t4;
    	let t5_value = /*cocktail*/ ctx[7].vol + "";
    	let t5;
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let div1;
    	let t9;
    	let each_value_1 = /*cocktail*/ ctx[7].composition;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			b0 = element("b");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text("№ ");
    			b1 = element("b");
    			t3 = text(t3_value);
    			t4 = text(" (");
    			t5 = text(t5_value);
    			t6 = text(" мл)");
    			t7 = space();
    			p2 = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div1 = element("div");
    			t9 = space();
    			add_location(b0, file, 104, 8, 2452);
    			add_location(p0, file, 104, 5, 2449);
    			add_location(b1, file, 105, 10, 2489);
    			add_location(p1, file, 105, 5, 2484);
    			add_location(p2, file, 106, 5, 2539);
    			attr_dev(div0, "class", "item_info svelte-gk09je");
    			add_location(div0, file, 103, 4, 2420);
    			attr_dev(div1, "class", "img svelte-gk09je");

    			set_style(div1, "background-image", "url(" + (/*cocktail*/ ctx[7].img
    			? /*cocktail*/ ctx[7].img
    			: "/img/" + /*cocktail*/ ctx[7].value + ".jpg") + ")");

    			add_location(div1, file, 112, 4, 2729);
    			attr_dev(div2, "class", "item svelte-gk09je");
    			add_location(div2, file, 102, 3, 2397);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(p0, b0);
    			append_dev(b0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, b1);
    			append_dev(b1, t3);
    			append_dev(p1, t4);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, p2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p2, null);
    			}

    			append_dev(div2, t8);
    			append_dev(div2, div1);
    			append_dev(div2, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*db, ingridients, Object*/ 0) {
    				each_value_1 = /*cocktail*/ ctx[7].composition;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(102:2) {#each db as cocktail, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let a;
    	let t0;
    	let t1_value = (/*isOpenSearch*/ ctx[1] ? "↓" : "→") + "";
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let dispose;
    	let if_block = /*isOpenSearch*/ ctx[1] === true && create_if_block(ctx);
    	let each_value = db;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			a = element("a");
    			t0 = text("Поиск ");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "href", "javascript:");
    			add_location(a, file, 75, 2, 1406);
    			add_location(div0, file, 74, 1, 1398);
    			attr_dev(div1, "class", "cocktails svelte-gk09je");
    			add_location(div1, file, 100, 1, 2342);
    			attr_dev(div2, "class", "container svelte-gk09je");
    			add_location(div2, file, 73, 0, 1373);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(div0, t2);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*openSeacrh*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isOpenSearch*/ 2 && t1_value !== (t1_value = (/*isOpenSearch*/ ctx[1] ? "↓" : "→") + "")) set_data_dev(t1, t1_value);

    			if (/*isOpenSearch*/ ctx[1] === true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*db, ingridients, Object*/ 0) {
    				each_value = db;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const typesArray = Object.keys(ingridients_structure).map(key => ({ ...ingridients_structure[key], type: key }));
    	const typesFlags = {};
    	Object.keys(ingridients_structure).forEach(key => $$invalidate(0, typesFlags[key] = false, typesFlags));
    	let isOpenSearch = false;
    	let isOpenContains = false;

    	const toggleType = type => () => {
    		$$invalidate(0, typesFlags[type] = !typesFlags[type], typesFlags);
    	};

    	function openSeacrh() {
    		$$invalidate(1, isOpenSearch = !isOpenSearch);
    	}

    	function openContains() {
    		$$invalidate(2, isOpenContains = !isOpenContains);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		db,
    		ingridients,
    		ingridients_structure,
    		typesArray,
    		typesFlags,
    		isOpenSearch,
    		isOpenContains,
    		toggleType,
    		openSeacrh,
    		openContains
    	});

    	$$self.$inject_state = $$props => {
    		if ("isOpenSearch" in $$props) $$invalidate(1, isOpenSearch = $$props.isOpenSearch);
    		if ("isOpenContains" in $$props) $$invalidate(2, isOpenContains = $$props.isOpenContains);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		typesFlags,
    		isOpenSearch,
    		isOpenContains,
    		typesArray,
    		toggleType,
    		openSeacrh,
    		openContains
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
