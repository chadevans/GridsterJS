/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, dojo, logger */
/*mendix */
/*
	GridsterJS
	========================

	@file      : GridsterJS.js
	@version   : 1.0
	@author    : Chad Evans
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

	Documentation
    ========================
	Mendix widget for GridsterJS
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require({
    packages: [{
        name: 'jquery',
        location: '../../widgets/GridsterJS/widget/lib',
        main: 'jquery-1.11.2.min'
        }]
}, [
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text',
    'jquery', 'dojo/text!GridsterJS/widget/template/GridsterJS.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, $, widgetTemplate) {
    'use strict';

    // Declare widget's prototype.
    return declare('GridsterJS.widget.GridsterJS', [_WidgetBase, _TemplatedMixin], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _gridster: null,
        _associated: false,

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

            if (!this._associated) {
                this._setupGridster();
                this._associated = true;
            }

            callback();
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        _setupEvents: function () {},

        _setupGridster: function () {
            var tr_count, col_count = 0,
                col_size = [],
                col_sizex = [],
                col_min = 0,
                col_max, index,
                source = $('.' + this.mxtableclass),
                target = this.domNode,
                options = {
                    widget_base_dimensions: [this.dimensionwidth, this.dimensionheight],
                    widget_margins: [this.marginhorizontal, this.marginvertical],
                    widget_selector: 'div',
                    draggable: {
                        stop: lang.hitch(this, function (e, ui) {
                            this.savePositions();
                        })
                    }
                };

            if (!$('.' + this.mxtableclass)) {
                console.log(this.id + '.setupGridster - cannot find the source table.');
            } else {
                //console.log(this.id + '.setupGridster - loading');

                // Find the width of the columns

                // loop over the columns, '>' prevents overreach of the selector to other sub-tables
                $(source).find(' > colgroup > col').each(function (index, value) {
                    col_size[col_count] = $(value).width();
                    col_count++;
                });

                // Find the minimum width of the columns
                col_min = Math.min.apply(null, col_size);

                // Figure out the correct data-sizex to use for the relative size of the columns
                $(col_size).each(function (index, value) {
                    col_sizex[index] = Math.round(value / col_min);
                });

                tr_count = 0;
                //Loop over the rows, '>' prevents overreach of the selector to other sub-tables
                $(source).find(' > tbody > tr').each(function (r_index, r_value) {
                    tr_count++;
                    col_count = 0;

                    //Loop over the columns, '>' prevents overreach of the selector to other sub-tables
                    var cells = $(r_value).find(' > th , > td');
                    $(cells).each(function (c_index, c_value) {
                        col_count++;

                        var calc_col_size = col_sizex[col_count - 1],
                            colspan_value,
                            colspan_index,
                            newcell;
                        if ($(c_value).hasAttr('colspan')) {
                            colspan_value = $(c_value).attr('colspan');
                            for (colspan_index = 1; colspan_index < colspan_value; colspan_index++) {
                                calc_col_size = calc_col_size + col_sizex[col_count - 1 + colspan_index];
                            }
                        }

                        newcell = $('<div></div>')
                            .appendTo(target)
                            .attr('data-row', tr_count)
                            .attr('data-col', col_count)
                            .attr('data-sizex', calc_col_size)
                            .attr('data-sizey', 1)
                            .addClass($(c_value).attr('class'));

                        // Add all the child nodes to the new cell, which excludes the current cell (td)
                        $(c_value.childNodes).appendTo(newcell);
                    }); // cells loop
                }); // row loop

                // Remove the source table
                $(source).remove();

                if (this.autocalcmaxcolumns) {
                    col_max = 0;
                    for (index = 0; index < col_sizex.length; index++) {
                        col_max += col_sizex[index];
                    }
                    this.objectmix(options, {
                        max_cols: col_max
                    });
                }

                if (this.extraoptions !== '') {
                    this.objectmix(options, dojo.fromJson(this.extraoptions));
                }

                this.loadPositions(lang.hitch(this, function () {
                    // set up gridster for the node
                    this._gridster = $(target).gridster(options).data('gridster');
                }));
            }
        },

        savePositions: function () {
            if (this.savelayoutmf && this.savelayoutmf !== '') {
                var positions = this._gridster.serialize();

                mx.data.create({
                    entity: this.layoutEntity,
                    callback: lang.hitch(this, function (obj) {
                        obj.set(this.layoutJSON, JSON.stringify(positions));
                        this._execMF(obj, this.savelayoutmf);
                    }),
                    error: function (err) {
                        logger.warn('Error creating object: ', err);
                    }
                }, this);
            }
        },

        loadPositions: function (cb) {
            var pos;

            this._execMF(null, this.loadlayoutmf, lang.hitch(this, function (objs) {
                if (objs && objs instanceof Array) {
                    pos = objs[0].get(this.layoutJSON);
                    if (pos && pos !== '') {
                        var positions = JSON.parse(pos);

                        // Add the saved layout, if set
                        if (positions && positions instanceof Array) {
                            $(this.domNode.childNodes).each(function (index, newcell) {
                                $(newcell).attr('data-row', positions[index].row)
                                    .attr('data-col', positions[index].col)
                                    .attr('data-sizex', positions[index].size_x)
                                    .attr('data-sizey', positions[index].size_y);
                            });
                        }
                    }
                }

                if (cb) {
                    cb();
                }
            }));
        },

        objectmix: function (base, toadd) {
            var key, src, target, i;

            if (toadd) {
                for (key in toadd) {
                    if (key in base &&
                        ((dojo.isArray(toadd[key]) !== dojo.isArray(base[key])) ||
                            (dojo.isObject(toadd[key]) !== dojo.isObject(base[key])))) {
                        throw "Cannot mix object properties, property '" + key + "' has different type in source and destination object";
                    }

                    if (key in base && dojo.isArray(toadd[key])) {
                        //base is checked in the check above
                        //mix array
                        src = toadd[key];
                        target = base[key];
                        for (i = 0; i < src.length; i++) {
                            if (i < target.length) {
                                if (dojo.isObject(src[i]) && dojo.isObject(target[i])) {
                                    this.objectmix(target[i], src[i]);
                                } else {
                                    target[i] = src[i];
                                }
                            } else {
                                target.push(src[i]);
                            }
                        }
                    } else if (key in base && dojo.isObject(toadd[key])) {
                        //mix object
                        //base is checked in the check above
                        this.objectmix(base[key], toadd[key]);
                    } else {
                        //mix primitive
                        base[key] = toadd[key];
                    }
                }
            }
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
                        logger.warn(error.description);
                    }
                }, this);

            } else if (cb) {
                cb();
            }
        }
    });
});