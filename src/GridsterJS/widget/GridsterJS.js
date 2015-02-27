/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mendix, require, console, define, module, logger, mxui */
/*mendix */
/**

	GridsterJS
	========================

	@file      : GridsterJS.js
	@version   : 0.5
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
            _positions: null,

            // Template path
            templatePath: require.toUrl('GridsterJS/widget/templates/GridsterJS.html'),

            /**
             * Mendix Widget methods.
             * ======================
             */

            // DOJO.WidgetBase -> PostCreate is fired after the properties of the widget are set.
            postCreate: function () {

                // postCreate
                //console.log('GridsterJS - postCreate');

                // Load CSS ... automaticly from ui directory

                // Setup widgets
                this._setupWidget();

                // Create childnodes
                this._createChildNodes();

            },

            // DOJO.WidgetBase -> Startup is fired after the properties of the widget are set.
            startup: function () {

                // postCreate
                //console.log('GridsterJS - startup');

            },

            /**
             * What to do when data is loaded?
             */

            update: function (obj, callback) {

                // startup
                //console.log('GridsterJS - update');

                // Execute callback.
                if (typeof callback !== 'undefined') {
                    callback();
                }
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
                var gridsterWidget = this,
                    $ = this.$,
                    options = {
                        widget_base_dimensions: [this.dimensionwidth, this.dimensionheight],
                        widget_margins: [this.marginhorizontal, this.marginvertical],
                        widget_selector: 'div',
                        draggable: {
                            stop: function (e, ui) {
                                gridsterWidget.setPositions(gridsterWidget);
                            }
                        }
                    };

                if (!$('.' + gridsterWidget.mxtableclass)) {

                    console.log('GridsterJS - cannot find the source table.');

                } else {

                    gridsterWidget.getPositions(gridsterWidget);

                    setTimeout(function () {

                        var tr_count, col_count = 0,
                            col_size = [],
                            col_sizex = [],
                            col_min = 0,
                            col_max, index,
                            newcells = [],
                            source = $('.' + gridsterWidget.mxtableclass),
                            target = gridsterWidget.domNode;

                        //console.log('GridsterJS - createChildNodes events');

                        // Find the width of the columns

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

                                var calc_col_size = col_sizex[col_count - 1],
                                    colspan_value,
                                    colspan_index,
                                    newcell;
                                if ($(value).hasAttr('colspan')) {
                                    colspan_value = $(value).attr('colspan');
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
                                    .addClass($(value).attr('class'));
                                newcells.push(newcell);

                                // Add all the child nodes to the new cell, which excludes the current cell (td)
                                $(value.childNodes).appendTo(newcell);

                            });

                        });

                        // Add the saved layout, if set
                        if (gridsterWidget._positions && gridsterWidget._positions instanceof Array) {
                            $(newcells).each(function (index, newcell) {
                                newcell.attr('data-row', gridsterWidget._positions[index].row)
                                    .attr('data-col', gridsterWidget._positions[index].col)
                                    .attr('data-sizex', gridsterWidget._positions[index].size_x)
                                    .attr('data-sizey', gridsterWidget._positions[index].size_y);

                            });
                        }

                        // Remove the source table
                        $(source).remove();

                        if (gridsterWidget.autocalcmaxcolumns) {
                            col_max = 0;
                            for (index = 0; index < col_sizex.length; index++) {
                                col_max += col_sizex[index];
                            }
                            gridsterWidget.objectmix(options, {
                                max_cols: col_max
                            });
                        }

                        if (gridsterWidget.extraoptions !== '')
                            gridsterWidget.objectmix(options, dojo.fromJson(gridsterWidget.extraoptions));

                        // set up gridster for the node
                        gridsterWidget._gridster = $(target).gridster(options).data('gridster');

                    }, 100);
                }
            },

            setPositions: function (gridsterWidget) {

                gridsterWidget._positions = gridsterWidget._gridster.serialize();

                mx.data.create({
                    entity: this.layoutEntity,
                    callback: function (obj) {
                        obj.set(this.layoutJSON, JSON.stringify(gridsterWidget._positions));
                        this._execMF(obj, this.savelayoutmf);
                    },
                    error: function (err) {
                        logger.warn('Error creating object: ', err);
                    }
                }, this);

            },

            getPositions: function (gridsterWidget) {

                var pos;

                gridsterWidget._execMF(null, gridsterWidget.loadlayoutmf, function (objs) {
                    if (objs && objs instanceof Array) {
                        pos = objs[0].get(gridsterWidget.layoutJSON);
                        if (pos && pos !== '') {
                            gridsterWidget._positions = JSON.parse(pos);
                        }
                    }
                });

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