/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mendix, require, console, define, module, logger, mxui */
/*mendix */
/**

	GridsterJS
	========================

	@file      : GridsterJS.js
	@version   : 0.4
	@author    : Chad Evans
	@date      : Fri, 30 Jan 2015 15:25:54 GMT
	@copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

	Documentation
    ========================
	Mendix widget for GridsterJS

*/

(function () {
    'use strict';

    // Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
    require([

        'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_Widget', 'dijit/_TemplatedMixin',
        'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/window', 'dojo/on', 'dojo/_base/lang', 'dojo/text',
        'GridsterJS/widget/lib/jquery'

    ], function (declare, _WidgetBase, _Widget, _Templated, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, win, on, lang, text, _jQuery) {

        // Declare widget.
        return declare('GridsterJS.widget.GridsterJS', [_WidgetBase, _Widget, _Templated, _jQuery], {

            /**
             * Internal variables.
             * ======================
             */
            _gridster: null,

            // Template path
            templatePath: require.toUrl('GridsterJS/widget/templates/GridsterJS.html'),

            /**
             * Mendix Widget methods.
             * ======================
             */

            // DOJO.WidgetBase -> PostCreate is fired after the properties of the widget are set.
            postCreate: function () {

                // postCreate
                console.log('GridsterJS - postCreate');

                // Load CSS ... automaticly from ui directory

                // Setup widgets
                this._setupWidget();

                // Create childnodes
                this._createChildNodes();

            },

            // DOJO.WidgetBase -> Startup is fired after the properties of the widget are set.
            startup: function () {

                // postCreate
                console.log('GridsterJS - startup');

            },

            /**
             * What to do when data is loaded?
             */

            update: function (obj, callback) {

                // startup
                console.log('GridsterJS - update');

                // Execute callback.
                if (typeof callback !== 'undefined') {
                    callback();
                }
            },

            /**
             * How the widget re-acts from actions invoked by the Mendix App.
             */
            suspend: function () {
                //TODO, what will happen if the widget is suspended (not visible).
            },

            resume: function () {
                //TODO, what will happen if the widget is resumed (set visible).
            },

            enable: function () {
                //TODO, what will happen if the widget is suspended (not visible).
            },

            disable: function () {
                //TODO, what will happen if the widget is resumed (set visible).
            },

            uninitialize: function () {
                //TODO, clean up only events
            },


            /**
             * Extra setup widget methods.
             * ======================
             */
            _setupWidget: function () {

                // Setup jQuery
                this.$ = _jQuery().jQuery();

            },

            // Create child nodes.
            _createChildNodes: function () {

                // Need to set the variable to a local (closure) context for setTimeout,
                // as setTimeout uses a different context for 'this'
                var gridsterWidget = this;
                var $ = this.$;
                var options = {
                    widget_base_dimensions: [this.dimensionwidth, this.dimensionheight],
                    widget_margins: [this.marginhorizontal, this.marginvertical],
                    widget_selector: 'div',
                    draggable: {
                        stop: function (e, ui) {
                            gridsterWidget.setPositions(JSON.stringify(gridsterWidget._gridster.serialize()));
                        }
                    }
                };

                if (!$('.' + gridsterWidget.mxtableclass)) {
                    console.log('GridsterJS - cannot find the source table.');
                } else {

                    setTimeout(function () {

                        var source = $('.' + gridsterWidget.mxtableclass);
                        var target = gridsterWidget.domNode;

                        // Assigning externally loaded library to internal variable inside function.
                        var tr_count, col_count;

                        console.log('GridsterJS - createChildNodes events');

                        // Find the width of the columns
                        var col_size = [],
                            col_min = 0;
                        col_count = 0;
                        // loop over the columns, '>' prevents overreach of the selector to other sub-tables
                        $(source).find(' > colgroup > col').each(function (index, value) {
                            col_size[col_count] = $(value).width();
                            //console.log('GridsterJS - col orig ' + col_count + ' of size ' + col_size[col_count]);
                            col_count++;
                        });

                        // Find the minimum width of the columns
                        col_min = Math.min.apply(null, col_size);
                        //console.log('GridsterJS - col min ' + col_min);

                        // Figure out the correct data-sizex to use for the relative size of the columns
                        var col_sizex = [];
                        $(col_size).each(function (index, value) {
                            col_sizex[index] = Math.round(value / col_min);
                            //console.log('GridsterJS - col modified ' + index + ' of size ' + col_sizex[index]);
                        });

                        tr_count = 0;
                        //Loop over the rows, '>' prevents overreach of the selector to other sub-tables
                        $(source).find(' > tbody > tr').each(function (index, value) {

                            tr_count++;
                            col_count = 0;

                            //Loop over the columns, '>' prevents overreach of the selector to other sub-tables
                            $(value).find(' > th , > td').each(function (index, value) {

                                col_count++;

                                var calc_col_size = col_sizex[col_count - 1];
                                if ($(value).hasAttr('colspan')) {
                                    var colspan_value = $(value).attr('colspan');
                                    for (var i = 1; i < colspan_value; i++) {
                                        calc_col_size = calc_col_size + col_sizex[col_count - 1 + i];
                                    }
                                }
                                var cell = $('<div></div>')
                                    .appendTo(target)
                                    .attr('data-row', tr_count)
                                    .attr('data-col', col_count)
                                    .attr('data-sizex', calc_col_size)
                                    .attr('data-sizey', 1);

                                $(value.childNodes).appendTo(cell);

                            });

                        });

                        // Remove the source table
                        $(source).remove();

                        if (gridsterWidget.autocalcmaxcolumns) {
                            var maxcol = 0;
                            for (var i = 0; i < col_sizex.length; i++) {
                                maxcol += col_sizex[i];
                            }
                            gridsterWidget.objectmix(options, {
                                max_cols: maxcol
                            });
                        }

                        if (gridsterWidget.extraoptions != '')
                            gridsterWidget.objectmix(options, dojo.fromJson(gridsterWidget.extraoptions));

                        // set up gridster for the node
                        gridsterWidget._gridster = $(target).gridster(options).data('gridster');

                    }, 100);
                }
            },

            setPositions: function (pos) {

                mx.data.create({
                    entity: this.layoutEntity,
                    callback: function (obj) {
                        obj.set(this.layoutJSON, pos);
                        this._execMF(obj, this.savelayoutmf);
                    },
                    error: function (err) {
                        logger.warn('Error creating object: ', err);
                    }
                }, this);
                
            },

            objectmix: function (base, toadd) {
                if (toadd) {
                    /*console.log("in");
                    console.dir(base);
                    console.log("add");
                    console.dir(toadd);*/
                    for (var key in toadd) {
                        if ((key in base) &&
                            ((dojo.isArray(toadd[key]) != dojo.isArray(base[key])) ||
                                (dojo.isObject(toadd[key]) != dojo.isObject(base[key]))))
                            throw "Cannot mix object properties, property '" + key + "' has different type in source and destination object";

                        //mix array
                        if (key in base && dojo.isArray(toadd[key])) { //base is checked in the check above
                            var src = toadd[key];
                            var target = base[key];
                            for (var i = 0; i < src.length; i++) {
                                if (i < target.length) {
                                    if (dojo.isObject(src[i]) && dojo.isObject(target[i]))
                                        this.objectmix(target[i], src[i]);
                                    else
                                        target[i] = src[i];
                                } else
                                    target.push(src[i]);
                            }
                        }
                        //mix object
                        else if (key in base && dojo.isObject(toadd[key])) //base is checked in the check above
                            this.objectmix(base[key], toadd[key]);
                        //mix primitive
                        else
                            base[key] = toadd[key];
                    }
                }
                /*console.log("out");
                console.dir(base);*/
            },

            _execMF: function (obj, mf, cb) {
                if (mf) {
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
            },

        });
    });

}());