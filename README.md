# GridsterJS

This widget provides Mendix with the ability to have drag and drop multi-column grid. The widget is based on the Gridster project
at http://gridster.net/ and https://github.com/ducksboard/gridster.js.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

Use a standard Mendix Table container to use a nice design-time control, and at run-time, this widget will transform that Table container into a Gridster control.
The widget will also automatically set the relative cell size (data-sizex) of the cell based on the table column sizes.
 
## Configuration

To use the widget, do the following:

1. Add GridsterJS widget to a page.
2. Create a Mendix Table container.
3. On the table, add the class "gridstertable".
