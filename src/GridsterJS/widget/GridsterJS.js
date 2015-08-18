/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery, window */
/*mendix */
/*
    GridsterJS
    ========================

    @file      : Gridster.js
    @version   : 1.1
    @author    : Chad Evans
    @date      : 18 August 2015
	@copyright : 2015, Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

    Documentation
    ========================
    Mendix widget for GridsterJS.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/on', 'dojo/query', 'dojo/dom-construct', 'dojo/json', 'dojo/dom-class', 'dojo/dom-style',
    'dojo/dom-attr', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text', 'dojo/html', 'dojo/_base/event',
    'GridsterJS/lib/jquery-1.11.2.min', 'GridsterJS/lib/jquery.gridster', 'dojo/text!GridsterJS/widget/template/GridsterJS.html'
], function (declare, _WidgetBase, _TemplatedMixin,
    dom, dojoDom, dojoOn, domQuery, domConstruct, JSON, domClass, domStyle,
    domAttr, dojoArray, lang, text, html, event,
    _jQuery, _gridster, widgetTemplate) {
    'use strict';

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare('GridsterJS.widget.GridsterJS', [_WidgetBase, _TemplatedMixin], {

        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        layoutEntity: "",
        layoutJSON: "",
        savelayoutmf: "",
        loadlayoutmf: "",
        dimensionwidth: 0,
        dimensionheight: 0,
        marginhorizonal: 0,
        marginvertical: 0,
        autocalcmaxcolumns: false,
        mxtableclass: "",
        extraoptions: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _gridster: null,
        _associated: false,
        _resizeHandle: null,
        _gridster_options: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {},

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            //console.log(this.id + '.postCreate');

            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            //console.log(this.id + '.update');

            this._contextObj = obj;
            this._updateRendering();

            callback();
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {},

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {},

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
            //this._resize_gridster();
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            if (this._resizeHandle) {
                this._resizeHandle.remove();
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {},

        // Rerender the interface.
        _updateRendering: function () {
            if (!this._associated) {
                this._setupGridster();
                this._associated = true;
            }
            //this._resize_gridster();
        },

        _setupGridster: function () {
            var widget = this,
                tr_count, col_count = 0,
                col_size = [],
                col_sizex = [],
                col_min = 0,
                col_max, index,
                sources = domQuery('.' + this.mxtableclass, this.domNode.offsetParent),
                target = this.domNode;
            widget._gridster_options = {
                widget_margins: [this.marginhorizonal, this.marginvertical],
                widget_selector: 'div',
                draggable: {
                    stop: lang.hitch(this, function (e, ui) {
                        this._savePositions();
                    })
                }
            };

            sources.forEach(function (source, s_index) {
                //console.log(this.id + '.setupGridster - loading');

                // Find the width of the columns

                // loop over the columns, '>' prevents overreach of the selector to other sub-tables
                domQuery(' > colgroup > col', source).forEach(function (c_value, c_index) {
                    col_size[col_count] = $(c_value).width();
                    col_count++;
                }); // col forEach

                // Find the minimum width of the columns
                col_min = Math.min.apply(null, col_size);

                // Figure out the correct data-sizex to use for the relative size of the columns
                dojoArray.forEach(col_size, function (value, index) {
                    col_sizex[index] = Math.round(value / col_min);
                });

                tr_count = 0;
                //Loop over the rows, '>' prevents overreach of the selector to other sub-tables
                domQuery(' > tbody > tr', source).forEach(function (r_value, r_index) {
                    tr_count++;
                    col_count = 0;

                    //Loop over the columns, '>' prevents overreach of the selector to other sub-tables
                    var cells = domQuery(' > th , > td', r_value);
                    cells.forEach(function (c_value, c_index) {
                        col_count++;

                        var calc_col_size = col_sizex[col_count - 1],
                            colspan_value,
                            colspan_index,
                            newcell;
                        if (domAttr.has(c_value, 'colspan')) {
                            colspan_value = domAttr.get(c_value, 'colspan');
                            for (colspan_index = 1; colspan_index < colspan_value; colspan_index++) {
                                calc_col_size = calc_col_size + col_sizex[col_count - 1 + colspan_index];
                            }
                        }

                        newcell = domConstruct.create('div', {
                            'data-row': tr_count,
                            'data-col': col_count,
                            'data-sizex': calc_col_size,
                            'data-sizey': 1
                        }, target);
                        domClass.add(newcell, domAttr.get(c_value, 'class'));

                        // Add all the child nodes to the new cell, which excludes the current cell (td)
                        dojoArray.forEach(c_value.childNodes, function (cn_value, cn_index) {
                            domConstruct.place(cn_value, newcell);
                        });
                    }); // cells loop
                }); // row loop

                // Remove the source table
                domConstruct.destroy(source);

                col_max = 0;
                for (index = 0; index < col_sizex.length; index++) {
                    col_max += col_sizex[index];
                }
                widget._gridster_options.max_cols = col_max;

                widget._gridster_options.widget_base_dimensions = 
                    [($(target).width() / widget._gridster_options.max_cols) - 40, 
                        widget.dimensionheight];

                if (widget.extraoptions !== '') {
                    lang.mixin(this._options, JSON.parse(widget.extraoptions));
                }

                widget._loadPositions(lang.hitch(widget, function () {
                    // turn on responsive
                    widget._gridster_options.autogenerate_stylesheet = true;
                    widget._gridster_options.widget_base_dimensions[0] = 'auto';
                    
                    // set up gridster for the node
                    this._gridster = $(target).gridster(widget._gridster_options).data('gridster');
                }));
            });
        },

        _resize_gridster: function () {
            if (this._gridster) {
                console.log(this.id + '.resize width ' + $(this.domNode).width());
                var dimensionhoriz =
                    ($(this.domNode).width() / this._gridster_options.max_cols) - 
                    this.marginhorizonal * (this._gridster_options.max_cols - 1);

                this._gridster.resize_widget_dimensions({
                    widget_base_dimensions: [dimensionhoriz, this.dimensionheight]
                });
            }
        },

        _savePositions: function () {
            if (this.savelayoutmf && this.savelayoutmf !== '') {
                var positions = this._gridster.serialize();

                mx.data.create({
                    entity: this.layoutEntity,
                    callback: lang.hitch(this, function (obj) {
                        obj.set(this.layoutJSON, JSON.stringify(positions));
                        this._execMF(obj, this.savelayoutmf);
                    }),
                    error: function (err) {
                        console.log('Error creating object: ', err);
                    }
                }, this);
            }
        },

        _loadPositions: function (cb) {
            var pos;

            this._execMF(null, this.loadlayoutmf, lang.hitch(this, function (objs) {
                if (objs && objs instanceof Array) {
                    pos = objs[0].get(this.layoutJSON);
                    if (pos && pos !== '') {
                        var positions = JSON.parse(pos);

                        // Add the saved layout, if set
                        if (positions && positions instanceof Array) {
                            dojoArray.forEach(this.domNode.childNodes, function (newcell, index) {
                                domAttr.set(newcell, 'data-row', positions[index].row);
                                domAttr.set(newcell, 'data-col', positions[index].col);
                                domAttr.set(newcell, 'data-sizex', positions[index].size_x);
                                domAttr.set(newcell, 'data-sizey', positions[index].size_y);
                            });
                        }
                    }
                }

                if (cb) {
                    cb();
                }
            }));
        },

        _execMF: function (obj, mf, cb) {
            if (mf && mf !== '') {
                var params = {
                    applyto: "selection",
                    actionname: mf,
                    guids: []
                };
                if (obj) {
                    params.guids = [obj.getGuid()];
                }
                mx.data.action({
                    params: params,
                    callback: function (objs) {
                        if (cb) {
                            cb(objs);
                        }
                    },
                    error: function (error) {
                        if (cb) {
                            cb();
                        }
                        console.log(error.description);
                    }
                }, this);

            } else if (cb) {
                cb();
            }
        }
    });
});
require(['GridsterJS/widget/GridsterJS'], function () {
    'use strict';
});