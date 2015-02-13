# GridsterJS

This widget provides Mendix with the ability to have drag and drop multi-column grid. The widget is based on the Gridster project
at http://gridster.net/ and https://github.com/ducksboard/gridster.js.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

Use a standard Mendix Table container for a nice design-time experience, and at run-time, this widget will transform
that Mendix Table container into a Gridster-enabled control. The widget will also automatically set the relative
cell size (data-sizex) of the cell based on the table column sizes.
 
## Configuration

To use the widget, do the following:

1. Add GridsterJS widget to a page.
2. Create a Mendix Table container.
3. On the table, add the class "gridstertable", or as is customized in the GridsterJS widget.

### Extra Options

To support additional options not directly configured in the Widget Properties, you can set these options using
the Extra Options property, in JSON format. For specific properties that are supported, see www.gridster.net.

An example of the value that might be contained in the extra options,

```JSON
{ extra_cols: 1, max_cols: 10 }
```

## Styling Notes

You will likely want to customize the styles of the grids. Some common overrides to have in your custom css are below.

###Drop Zone Style
```css
.wgt-GridsterJS .preview-holder {
    border: none;
    background: grey;
}
```
