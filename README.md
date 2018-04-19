# Photo Processing

You can use this in browser to compress any image when the image as upload is to large.

## Install

```
npm install photo_processing --save
```

and then in browser

```html
<script src="YourPath/photo_processing.js"></script>
```

## Usage

```js
var pp = new photo_processing( {
    rotate : true,
    zoom: true,
    zoom_width: 800,
    zoom_height: 600,
})

pp.processing( document.getElementById( 'YourFileInputID' ).files[0], function( base64_file ) {
    // output image by base64.
} )
```

or just only:

```js
var pp = new photo_processing( {
    zoom_width: 800,
} );
```