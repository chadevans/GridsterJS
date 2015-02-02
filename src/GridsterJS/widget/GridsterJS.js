/*jslint white:true, nomen: true, plusplus: true */
/*global mx, mendix, require, console, define, module, logger, mxui */
/*mendix */
/**

	GridsterJS
	========================

	@file      : GridsterJS.js
	@version   : 0.1
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

                // Setup events
                this._setupEvents();

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

                // Assigning externally loaded library to internal variable inside function.
                var $ = this.$, tr_count, col_count;

                console.log('GridsterJS - createChildNodes events');

                var source = $('.gridstertable');
                var target = this.domNode;
                
                // Find the width of the columns
                var col_size = [], col_min = 0;
                col_count = 0;
                $(source).find('col').each(function (index, value) {
                    col_size[col_count] = $(value).width();
                    console.log('GridsterJS - col ' + col_count + ' of size ' + col_size[col_count]);
                    col_count++;
                });
                
                // Find the minimum width of the columns
                col_min = Math.min.apply(null, col_size);
                console.log('GridsterJS - col min ' + col_min);
                
                // Figure out the correct data-sizex to use for the relative size of the columns
                var col_sizex = [];
                $(col_size).each(function (index, value) {
                    col_sizex[index] = Math.round(value / col_min);
                    console.log('GridsterJS - col ' + index + ' of size ' + col_sizex[index]);
                });

                tr_count = 1;
                //LOOP OVER ALL ROWS
                $(source).find('tr').each(function () {
                    col_count = 1;
                    //LOOP OVER EACH COLUMN IN THE ROW
                    $(this).find('th,td').each(function (index, value) {

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

                        col_count++;
                    });
                    tr_count++;
                });
                
                // Remove the source table
                //$(source).remove();
            },

            // Attach events to newly created nodes.
            _setupEvents: function () {

                // Assigning externally loaded library to internal variable inside function.
                var $ = this.$;

                console.log('GridsterJS - setup events');

                $(this.domNode).gridster({
                    widget_base_dimensions: [this.dimensionwidth, this.dimensionheight],
                    widget_margins: [this.marginhorizontal, this.marginvertical],
                    widget_selector: 'div',
                }).data('gridster');

                console.log('GridsterJS - setup events done');

            }
        });
    });

}());